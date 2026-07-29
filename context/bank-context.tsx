import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/expo';
import { CustomAlert } from '@/components/custom-alert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Bucket {
  id: number;
  name: string;
  category: 'bill' | 'saving' | 'goal';
  amount?: number; // For bills and savings
  current?: number; // For goals
  target?: number; // For goals
  note: string;
  date?: string; // For bills
}

export interface Transaction {
  id: number;
  label: string;
  sub: string;
  amount: number;
  category: string; // 'bill' | 'saving' | 'goal' | 'income'
}

export interface ChatMessage {
  id: number;
  from: 'zara' | 'user';
  text: string;
  isZara: boolean;
  isUser: boolean;
}

export interface PaymentCard {
  id: number;
  label: string;
}

interface BankContextType {
  balance: number;
  payingOut: number;
  saved: number;
  buckets: Bucket[];
  activity: Transaction[];
  chat: ChatMessage[];
  chatInput: string;
  balanceHidden: boolean;
  notificationsOn: boolean;
  faceIdOn: boolean;
  paymentCards: PaymentCard[];
  setChatInput: (val: string) => void;
  toggleBalanceHidden: () => void;
  toggleNotifications: () => void;
  toggleFaceId: () => void;
  addBucket: (name: string, category: 'bill' | 'saving' | 'goal', amount: number, date?: string, target?: number, starting?: number) => void;
  deleteBucket: (id: number) => void;
  topUp: (amount: number, source: 'bank' | 'card') => void;
  sendMoney: (recipient: string, amount: number, note: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  addPaymentCard: () => void;
  sendChatMessage: (text: string) => void;
  addToGoal: (goalId: number, amount: number) => void;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

const KNOWN = [
  { key: 'electric', name: 'Electricity', cat: 'bill' as const },
  { key: 'water', name: 'Water', cat: 'bill' as const },
  { key: 'rent', name: 'Rent', cat: 'bill' as const },
  { key: 'grocer', name: 'Groceries', cat: 'saving' as const },
  { key: 'tax', name: 'Taxes', cat: 'saving' as const },
  { key: 'phone', name: 'Phone', cat: 'goal' as const },
];


function formatMoney(n: number) {
  return '$' + Number(n).toFixed(2);
}

export function BankProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  // Local state mirrored/synced with backend
  const [balance, setBalance] = useState(0);
  const [payingOut, setPayingOut] = useState(0);
  const [saved, setSaved] = useState(0);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [activity, setActivity] = useState<Transaction[]>([]);
  
  // Account state ids
  const [checkingAccountId, setCheckingAccountId] = useState<number | null>(null);
  const [savingsAccountId, setSavingsAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<{ title: string; message: string } | null>(null);

  // Layout preferences
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [faceIdOn, setFaceIdOn] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const [chat, setChat] = useState<ChatMessage[]>([
    { id: 0, from: 'zara', text: "Hey, I'm Zara. What can I do for you today?", isZara: true, isUser: false },
  ]);

  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([
    { id: 1, label: 'Visa •••• 4242' },
    { id: 2, label: 'Mastercard •••• 8831' },
  ]);

  const toggleBalanceHidden = () => setBalanceHidden(!balanceHidden);
  const toggleNotifications = () => setNotificationsOn(!notificationsOn);
  const toggleFaceId = () => setFaceIdOn(!faceIdOn);

  // Authenticated API request wrapper helper
  const apiCall = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }, [getToken]);

  // Unified data sync loop
  const loadingRef = useRef(false);
  const loadData = useCallback(async () => {
    if (!isSignedIn || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      // 1. Fetch user accounts
      const accountsRes = await apiCall('/api/accounts');
      const accountsList = accountsRes.accounts || [];

      // 2. Auto-provision accounts if they don't exist yet in the backend
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

      // 3. Fetch summary balances
      const summaryRes = await apiCall('/api/accounts/summary');
      const summary = summaryRes.summary;
      if (summary) {
        setBalance(parseFloat(summary.availableBalance) || 0);
        setPayingOut(parseFloat(summary.payingOut) || 0);
        setSaved(parseFloat(summary.lockedBalance) || 0);
      }

      // 4. Fetch recent transactions for checking account
      const txRes = await apiCall(`/api/transactions?accountId=${checking.id}&limit=50`);
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

      // 5. Parse transaction history to build active UI categories
      const activeBuckets: Bucket[] = [];
      rawTxList.forEach((t: any) => {
        if (t.type === 'withdrawal' && t.status === 'pending') {
          activeBuckets.push({
            id: t.id,
            name: t.description || 'Bill Payment',
            category: 'bill',
            amount: parseFloat(t.amount),
            note: `Set aside and scheduled. The money is reserved, not spendable, but hasn't been sent yet.`,
          });
        } else if (t.type === 'transfer' && t.toAccountId === savings.id) {
          const goalName = t.description || 'Savings Goal';
          const existing = activeBuckets.find(b => b.name === goalName && b.category === 'goal');
          if (existing) {
            existing.current = (existing.current || 0) + parseFloat(t.amount);
          } else {
            activeBuckets.push({
              id: t.id,
              name: goalName,
              category: 'goal',
              current: parseFloat(t.amount),
              target: 150, // default target mockup
              note: `Locked until the goal is reached.`,
            });
          }
        }
      });

      // Save active buckets list directly (starts empty if no buckets have been created)
      setBuckets(activeBuckets);

      // Write to AsyncStorage cache
      await AsyncStorage.setItem('bank_balance', summary.availableBalance);
      await AsyncStorage.setItem('bank_paying_out', summary.payingOut);
      await AsyncStorage.setItem('bank_saved', summary.lockedBalance);
      await AsyncStorage.setItem('bank_buckets', JSON.stringify(activeBuckets));
      await AsyncStorage.setItem('bank_activity', JSON.stringify(formattedTx));
      await AsyncStorage.setItem('bank_checking_id', String(checking.id));
      await AsyncStorage.setItem('bank_savings_id', String(savings.id));

    } catch (err) {
      console.error('Failed to load bank data:', err);
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
      loadingRef.current = false;
      setLoading(false);
    }
  }, [isSignedIn, apiCall]);

  // Refresh data on loading profile
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  // Check cache on mount
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedBalance = await AsyncStorage.getItem('bank_balance');
        const cachedPayingOut = await AsyncStorage.getItem('bank_paying_out');
        const cachedSaved = await AsyncStorage.getItem('bank_saved');
        const cachedBuckets = await AsyncStorage.getItem('bank_buckets');
        const cachedActivity = await AsyncStorage.getItem('bank_activity');
        const cachedCheckingId = await AsyncStorage.getItem('bank_checking_id');
        const cachedSavingsId = await AsyncStorage.getItem('bank_savings_id');

        if (cachedBalance !== null) setBalance(parseFloat(cachedBalance));
        if (cachedPayingOut !== null) setPayingOut(parseFloat(cachedPayingOut));
        if (cachedSaved !== null) setSaved(parseFloat(cachedSaved));
        if (cachedBuckets !== null) setBuckets(JSON.parse(cachedBuckets));
        if (cachedActivity !== null) setActivity(JSON.parse(cachedActivity));
        if (cachedCheckingId !== null) setCheckingAccountId(parseInt(cachedCheckingId, 10));
        if (cachedSavingsId !== null) setSavingsAccountId(parseInt(cachedSavingsId, 10));
      } catch (err) {
        console.error('Failed to load bank cache:', err);
      }
    };
    loadCache();
  }, []);

  // Clear cache on logout
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      AsyncStorage.multiRemove([
        'bank_balance',
        'bank_paying_out',
        'bank_saved',
        'bank_buckets',
        'bank_activity',
        'bank_checking_id',
        'bank_savings_id',
      ]).catch(err => console.error('Failed to clear cache on logout:', err));

      // Reset state
      setBalance(0);
      setPayingOut(0);
      setSaved(0);
      setBuckets([]);
      setActivity([]);
      setCheckingAccountId(null);
      setSavingsAccountId(null);
    }
  }, [isLoaded, isSignedIn]);

  // Create new bucket actions
  const addBucket = async (
    name: string,
    category: 'bill' | 'saving' | 'goal',
    amount: number,
    date?: string,
    target?: number,
    starting?: number
  ) => {
    if (!checkingAccountId || !savingsAccountId) return;
    const cleanName = name.trim() || 'New Bucket';
    
    try {
      if (category === 'bill') {
        await apiCall('/api/transactions/payments/schedule', {
          method: 'POST',
          body: JSON.stringify({
            checkingAccountId,
            amount: amount.toFixed(4),
            description: cleanName,
          }),
        });
      } else if (category === 'goal' || category === 'saving') {
        const lockAmount = starting || amount || 0;
        if (lockAmount <= 0) {
          setApiError({
            title: 'Starting Amount Required',
            message: `To create a ${category}, you must allocate a starting amount of at least $1.00 from your available balance.`,
          });
          return;
        }

        await apiCall('/api/transactions/transfer/lock', {
          method: 'POST',
          body: JSON.stringify({
            checkingAccountId,
            savingsAccountId,
            amount: lockAmount.toFixed(4),
            description: cleanName,
          }),
        });
      }
      await loadData();
    } catch (err) {
      console.error('Failed to create bucket:', err);
      setApiError({
        title: 'Failed to Create Bucket',
        message: (err as Error).message,
      });
    }
  };

  // Delete bucket actions
  const deleteBucket = async (id: number) => {
    if (!checkingAccountId || !savingsAccountId) return;
    const bucket = buckets.find(b => b.id === id);
    if (!bucket) return;

    try {
      if (bucket.category === 'bill') {
        await apiCall('/api/transactions/payments/execute', {
          method: 'POST',
          body: JSON.stringify({
            transactionId: id,
          }),
        });
      } else if (bucket.category === 'goal' || bucket.category === 'saving') {
        const unlockAmount = bucket.current || bucket.amount || 0;
        if (unlockAmount > 0) {
          await apiCall('/api/transactions/transfer/unlock', {
            method: 'POST',
            body: JSON.stringify({
              checkingAccountId,
              savingsAccountId,
              amount: unlockAmount.toFixed(4),
              description: `Unlocked: ${bucket.name}`,
            }),
          });
        }
      }
      await loadData();
    } catch (err) {
      console.error('Failed to delete bucket:', err);
      setApiError({
        title: 'Failed to Delete Bucket',
        message: (err as Error).message,
      });
    }
  };

  // Top up actions
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
      await loadData();
    } catch (err) {
      console.error('Top up failed:', err);
      setApiError({
        title: 'Top Up Failed',
        message: (err as Error).message,
      });
    }
  };

  // Send Money peer transfer actions
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
      await loadData();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  // Add Card layout items
  const addPaymentCard = () => {
    const newId = Date.now();
    const newCard: PaymentCard = {
      id: newId,
      label: 'Visa •••• ' + Math.floor(1000 + Math.random() * 9000),
    };
    setPaymentCards(prev => [...prev, newCard]);
  };

  // Lock money to savings goals
  const addToGoal = async (goalId: number, amount: number) => {
    if (!checkingAccountId || !savingsAccountId || amount <= 0) return;
    const goal = buckets.find(b => b.id === goalId);
    if (!goal) return;

    try {
      await apiCall('/api/transactions/transfer/lock', {
        method: 'POST',
        body: JSON.stringify({
          checkingAccountId,
          savingsAccountId,
          amount: amount.toFixed(4),
          description: goal.name,
        }),
      });
      await loadData();
    } catch (err) {
      console.error('Failed to add to goal:', err);
      setApiError({
        title: 'Failed to Lock Funds',
        message: (err as Error).message,
      });
    }
  };

  // NLP Chat Parser
  const parseChatMessage = (text: string) => {
    const lower = text.toLowerCase();
    const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const isGoalWord = /goal|save|lock/.test(lower);
    const found = KNOWN.find(k => lower.includes(k.key));
    
    if (found) {
      return { name: found.name, cat: isGoalWord ? ('goal' as const) : found.cat, amount };
    }

    let m = lower.match(/(?:create|make|add)\s+(?:a |an |new )?(.+?)\s+(?:bill|bucket|goal)/);
    let name = m ? m[1] : null;
    if (!name) {
      m = lower.match(/for\s+(.+?)(?:\.|$)/);
      name = m ? m[1] : null;
    }
    if (!name) name = 'new bucket';

    name = name.replace(/\$?\d+(\.\d+)?\s*(dollars?)?/g, '').trim();
    name = name.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'New bucket';
    
    return { name, cat: isGoalWord ? ('goal' as const) : ('bill' as const), amount };
  };

  const sendChatMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const parsed = parseChatMessage(cleanText);
    
    let responseText = '';
    if (parsed.cat === 'goal') {
      responseText = `Done — ${formatMoney(parsed.amount)} added toward ${parsed.name}. I'll keep it locked until you hit the goal.`;
    } else {
      responseText = `Done — ${formatMoney(parsed.amount)} for ${parsed.name}. I'll pay that automatically when it's due.`;
    }

    setChat(prev => [
      ...prev,
      { id: prev.length, from: 'user', text: cleanText, isUser: true, isZara: false },
      { id: prev.length + 1, from: 'zara', text: responseText, isUser: false, isZara: true },
    ]);

    await addBucket(parsed.name, parsed.cat, parsed.amount);
  };

  return (
    <BankContext.Provider
      value={{
        balance,
        payingOut,
        saved,
        buckets,
        activity,
        chat,
        chatInput,
        balanceHidden,
        notificationsOn,
        faceIdOn,
        paymentCards,
        setChatInput,
        toggleBalanceHidden,
        toggleNotifications,
        toggleFaceId,
        addBucket,
        deleteBucket,
        topUp,
        sendMoney,
        addPaymentCard,
        sendChatMessage,
        addToGoal,
      }}
    >
      {children}
      <CustomAlert
        visible={apiError !== null}
        title={apiError?.title || ''}
        message={apiError?.message || ''}
        onClose={() => setApiError(null)}
      />
    </BankContext.Provider>
  );
}

export function useBank() {
  const context = useContext(BankContext);
  if (context === undefined) {
    throw new Error('useBank must be used within a BankProvider');
  }
  return context;
}
