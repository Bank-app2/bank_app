import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/expo';
import { useApi } from '@/hooks/useApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccounts } from '@/features/accounts/context/AccountsContext';

export interface Transaction {
  id: number;
  label: string;
  sub: string;
  amount: number;
  category: string; // 'bill' | 'saving' | 'goal' | 'income'
}

interface TransactionsContextType {
  activity: Transaction[];
  isLoadingTransactions: boolean;
  loadTransactions: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const apiCall = useApi();
  const { checkingAccountId } = useAccounts();

  const [activity, setActivity] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!isSignedIn || !checkingAccountId) return;
    setIsLoadingTransactions(true);
    try {
      const txRes = await apiCall(`/api/transactions?accountId=${checkingAccountId}&limit=50`);
      const rawTxList = txRes.transactions || [];
      const formattedTx: Transaction[] = rawTxList.map((t: any) => {
        let category = 'bill';
        if (t.type === 'deposit') {
          category = 'income';
        } else if (t.type === 'transfer') {
          category = t.description?.toLowerCase().includes('goal') ? 'goal' : 'saving';
        }

        return {
          id: t.id,
          label: t.description || (t.type === 'deposit' ? 'Top up' : 'Transfer'),
          sub: t.status === 'pending' ? 'pending' : '',
          amount: t.type === 'deposit' ? parseFloat(t.amount) : -parseFloat(t.amount),
          category,
        };
      });
      setActivity(formattedTx);
      await AsyncStorage.setItem('bank_activity', JSON.stringify(formattedTx));
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [isSignedIn, checkingAccountId, apiCall]);

  useEffect(() => {
    if (isLoaded && isSignedIn && checkingAccountId) {
      loadTransactions();
    }
  }, [isLoaded, isSignedIn, checkingAccountId, loadTransactions]);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedActivity = await AsyncStorage.getItem('bank_activity');
        if (cachedActivity !== null) setActivity(JSON.parse(cachedActivity));
      } catch (err) {
        console.error('Failed to load transactions cache:', err);
      }
    };
    loadCache();
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      AsyncStorage.removeItem('bank_activity').catch(err => console.error('Failed to clear cache on logout:', err));
      setActivity([]);
    }
  }, [isLoaded, isSignedIn]);

  return (
    <TransactionsContext.Provider
      value={{
        activity,
        isLoadingTransactions,
        loadTransactions,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
