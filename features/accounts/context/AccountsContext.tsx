import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/expo';
import { useApi } from '@/hooks/useApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaymentCard {
  id: number;
  label: string;
}

interface AccountsContextType {
  balance: number;
  payingOut: number;
  saved: number;
  checkingAccountId: number | null;
  savingsAccountId: number | null;
  paymentCards: PaymentCard[];
  isLoading: boolean;
  apiError: { title: string; message: string } | null;
  setApiError: (err: { title: string; message: string } | null) => void;
  loadAccounts: () => Promise<void>;
  topUp: (amount: number, source: 'bank' | 'card') => Promise<void>;
  sendMoney: (recipient: string, amount: number, note: string) => Promise<{ success: boolean; error?: string }>;
  addPaymentCard: () => void;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const apiCall = useApi();

  const [balance, setBalance] = useState(0);
  const [payingOut, setPayingOut] = useState(0);
  const [saved, setSaved] = useState(0);
  const [checkingAccountId, setCheckingAccountId] = useState<number | null>(null);
  const [savingsAccountId, setSavingsAccountId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<{ title: string; message: string } | null>(null);

  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([
    { id: 1, label: 'Visa •••• 4242' },
    { id: 2, label: 'Mastercard •••• 8831' },
  ]);

  const loadAccounts = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const accountsRes = await apiCall('/api/accounts');
      const accountsList = accountsRes.accounts || [];

      let checking = accountsList.find((a: any) => a.accountType === 'checking');
      let savings = accountsList.find((a: any) => a.accountType === 'savings');

      if (!checking) {
        const checkRes = await apiCall('/api/accounts', {
          method: 'POST',
          body: JSON.stringify({ accountType: 'checking' }),
        });
        checking = checkRes.account;
      }
      if (!savings) {
        const saveRes = await apiCall('/api/accounts', {
          method: 'POST',
          body: JSON.stringify({ accountType: 'savings' }),
        });
        savings = saveRes.account;
      }

      setCheckingAccountId(checking.id);
      setSavingsAccountId(savings.id);

      const summaryRes = await apiCall('/api/accounts/summary');
      const summary = summaryRes.summary;
      if (summary) {
        setBalance(parseFloat(summary.availableBalance) || 0);
        setPayingOut(parseFloat(summary.payingOut) || 0);
        setSaved(parseFloat(summary.lockedBalance) || 0);

        await AsyncStorage.setItem('bank_balance', summary.availableBalance);
        await AsyncStorage.setItem('bank_paying_out', summary.payingOut);
        await AsyncStorage.setItem('bank_saved', summary.lockedBalance);
      }
      
      await AsyncStorage.setItem('bank_checking_id', String(checking.id));
      await AsyncStorage.setItem('bank_savings_id', String(savings.id));
    } catch (err) {
      console.error('Failed to load accounts:', err);
      const errMsg = (err as Error).message;
      if (errMsg.includes('Too many requests') || errMsg.includes('429')) {
        setApiError({
          title: 'Rate Limit Exceeded',
          message: 'You have made too many requests. Please wait a few minutes before trying again.',
        });
      } else {
        setApiError({
          title: 'Network Error',
          message: 'Unable to connect to the banking server. Please check your network or try again later.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, apiCall]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadAccounts();
    }
  }, [isLoaded, isSignedIn, loadAccounts]);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedBalance = await AsyncStorage.getItem('bank_balance');
        const cachedPayingOut = await AsyncStorage.getItem('bank_paying_out');
        const cachedSaved = await AsyncStorage.getItem('bank_saved');
        const cachedCheckingId = await AsyncStorage.getItem('bank_checking_id');
        const cachedSavingsId = await AsyncStorage.getItem('bank_savings_id');

        if (cachedBalance !== null) setBalance(parseFloat(cachedBalance));
        if (cachedPayingOut !== null) setPayingOut(parseFloat(cachedPayingOut));
        if (cachedSaved !== null) setSaved(parseFloat(cachedSaved));
        if (cachedCheckingId !== null) setCheckingAccountId(parseInt(cachedCheckingId, 10));
        if (cachedSavingsId !== null) setSavingsAccountId(parseInt(cachedSavingsId, 10));
      } catch (err) {
        console.error('Failed to load accounts cache:', err);
      }
    };
    loadCache();
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      AsyncStorage.multiRemove([
        'bank_balance',
        'bank_paying_out',
        'bank_saved',
        'bank_checking_id',
        'bank_savings_id',
      ]).catch(err => console.error('Failed to clear cache on logout:', err));

      setBalance(0);
      setPayingOut(0);
      setSaved(0);
      setCheckingAccountId(null);
      setSavingsAccountId(null);
    }
  }, [isLoaded, isSignedIn]);

  const topUp = async (amount: number, source: 'bank' | 'card') => {
    if (amount <= 0 || !checkingAccountId) return;
    try {
      await apiCall('/api/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify({
          accountId: checkingAccountId,
          amount: amount.toFixed(4),
          description: `Top up via ${source}`,
        }),
      });
      await loadAccounts();
    } catch (err) {
      console.error('Top up failed:', err);
      setApiError({
        title: 'Top Up Failed',
        message: (err as Error).message,
      });
    }
  };

  const sendMoney = async (recipient: string, amount: number, note: string) => {
    const cleanRecipient = recipient.trim();
    if (!cleanRecipient) return { success: false, error: 'Add a recipient.' };
    if (amount <= 0) return { success: false, error: 'Enter an amount.' };
    if (amount > balance) return { success: false, error: "That's more than your available balance." };
    if (!checkingAccountId) return { success: false, error: 'Checking account not loaded.' };

    try {
      await apiCall('/api/transactions/payments/schedule', {
        method: 'POST',
        body: JSON.stringify({
          checkingAccountId,
          amount: amount.toFixed(4),
          description: `Sent to ${cleanRecipient} (${note.trim() || 'transfer'})`,
        }),
      });
      await loadAccounts();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  const addPaymentCard = () => {
    const newId = Date.now();
    const newCard: PaymentCard = {
      id: newId,
      label: 'Visa •••• ' + Math.floor(1000 + Math.random() * 9000),
    };
    setPaymentCards(prev => [...prev, newCard]);
  };

  return (
    <AccountsContext.Provider
      value={{
        balance,
        payingOut,
        saved,
        checkingAccountId,
        savingsAccountId,
        paymentCards,
        isLoading,
        apiError,
        setApiError,
        loadAccounts,
        topUp,
        sendMoney,
        addPaymentCard,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
}
