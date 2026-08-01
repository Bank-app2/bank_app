import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/expo';
import { useApi } from '@/hooks/useApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccounts } from '@/features/accounts/context/AccountsContext';

export type Recurrence = 'once' | 'monthly' | 'quarterly' | 'annually';

export interface Bucket {
  id: number;
  name: string;
  category: 'bill' | 'saving' | 'goal';
  amount?: number; // For bills and savings
  current?: number; // For goals
  target?: number; // For goals
  description: string;
  date?: string; // For bills
  recurrence?: Recurrence; // how often this bucket repeats
  dueDate?: string; // when the next occurrence is due
}

interface BucketsContextType {
  buckets: Bucket[];
  isLoadingBuckets: boolean;
  loadBuckets: () => Promise<void>;
  addBucket: (
    name: string,
    category: 'bill' | 'saving' | 'goal',
    amount: number,
    date?: string,
    target?: number,
    starting?: number,
    recurrence?: Recurrence,
    dueDate?: string,
    description?: string
  ) => Promise<void>;
  deleteBucket: (id: number) => Promise<void>;
  fundBucket: (goalId: number, amount: number) => Promise<void>;
  updateBucketDescription: (id: number, description: string) => Promise<{ success: boolean; error?: string }>;
  releaseBucketFunds: (id: number, amount: number) => Promise<{ success: boolean; error?: string }>;
  getBucketTransactions: (id: number) => Promise<any[]>;
}

const BucketsContext = createContext<BucketsContextType | undefined>(undefined);

export function BucketsProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const apiCall = useApi();
  const { checkingAccountId, savingsAccountId, loadAccounts, setApiError } = useAccounts();

  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false);

  const loadBuckets = useCallback(async () => {
    if (!isSignedIn || !checkingAccountId) return;
    setIsLoadingBuckets(true);
    try {
      const activeBuckets: Bucket[] = [];
      const bucketsRes = await apiCall(`/api/buckets?accountId=${checkingAccountId}`);
      const backendBuckets = bucketsRes.buckets || [];
      backendBuckets.forEach((b: any) => {
        let cat: 'goal' | 'saving' | 'bill' = 'saving';
        if (b.category === 'goals') cat = 'goal';
        if (b.category === 'bills') cat = 'bill';

        activeBuckets.push({
          id: b.id,
          name: b.name,
          category: cat,
          current: parseFloat(b.balance),
          amount: cat !== 'goal' ? parseFloat(b.balance) : undefined,
          target: cat === 'goal' ? parseFloat(b.target) || 0 : undefined,
          description: b.description || (cat === 'goal' ? 'Locked until the goal is reached.' : ''),
          recurrence: b.recurrence || 'once',
          dueDate: undefined,
        });
      });

      // Fetch pending withdrawals to show as bill buckets
      const txRes = await apiCall(`/api/transactions?accountId=${checkingAccountId}&limit=50`);
      const rawTxList = txRes.transactions || [];
      rawTxList.forEach((t: any) => {
        if (t.type === 'withdrawal' && t.status === 'pending') {
          activeBuckets.push({
            id: t.id,
            name: (t.description || 'Bill Payment').replace(/\s*\(repeats.*?\)/i, ''),
            category: 'bill',
            amount: parseFloat(t.amount),
            description: `Set aside and scheduled. The money is reserved, not spendable, but hasn't been sent yet.`,
            recurrence: 'once', // Parsing recurrence from desc omitted for brevity, logic mostly deprecated
            dueDate: t.dueDate,
          });
        }
      });

      setBuckets(activeBuckets);
      await AsyncStorage.setItem('bank_buckets', JSON.stringify(activeBuckets));
    } catch (err) {
      console.error('Failed to load buckets:', err);
    } finally {
      setIsLoadingBuckets(false);
    }
  }, [isSignedIn, checkingAccountId, apiCall]);

  useEffect(() => {
    if (isLoaded && isSignedIn && checkingAccountId) {
      loadBuckets();
    }
  }, [isLoaded, isSignedIn, checkingAccountId, loadBuckets]);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedBuckets = await AsyncStorage.getItem('bank_buckets');
        if (cachedBuckets !== null) setBuckets(JSON.parse(cachedBuckets));
      } catch (err) {
        console.error('Failed to load buckets cache:', err);
      }
    };
    loadCache();
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      AsyncStorage.removeItem('bank_buckets').catch(err => console.error('Failed to clear cache on logout:', err));
      setBuckets([]);
    }
  }, [isLoaded, isSignedIn]);

  const addBucket = async (
    name: string,
    category: 'bill' | 'saving' | 'goal',
    amount: number,
    date?: string,
    target?: number,
    starting?: number,
    recurrence: Recurrence = 'once',
    dueDate?: string,
    description?: string
  ) => {
    if (!checkingAccountId || !savingsAccountId) return;
    const cleanName = name.trim() || 'New Bucket';
    const recurrenceSuffix = recurrence !== 'once' ? ` (repeats ${recurrence})` : '';

    try {
      if (category === 'bill') {
        await apiCall('/api/transactions/payments/schedule', {
          method: 'POST',
          body: JSON.stringify({
            checkingAccountId,
            amount: amount.toFixed(4),
            description: `${cleanName}${recurrenceSuffix}`,
            dueDate,
          }),
        });
      } else if (category === 'goal' || category === 'saving') {
        const lockAmount = starting || amount || 0;
        const result = await apiCall('/api/buckets', {
          method: 'POST',
          body: JSON.stringify({
            accountId: checkingAccountId,
            name: cleanName,
            category: category === 'goal' ? 'goals' : 'savings',
            initialBalance: lockAmount.toFixed(4),
            target: target?.toFixed(4) || '0.0000',
            recurrence: recurrence
          }),
        });
        
        if (description && result?.bucket?.id) {
          await updateBucketDescription(result.bucket.id, description);
        }
      }
      await loadAccounts();
      await loadBuckets();
    } catch (err) {
      console.error('Failed to create bucket:', err);
      setApiError({
        title: 'Failed to Create Bucket',
        message: (err as Error).message,
      });
      throw err;
    }
  };

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
      await loadAccounts();
      await loadBuckets();
    } catch (err) {
      console.error('Failed to delete bucket:', err);
      setApiError({
        title: 'Failed to Delete Bucket',
        message: (err as Error).message,
      });
    }
  };

  const fundBucket = async (goalId: number, amount: number) => {
    if (!checkingAccountId || amount <= 0) return;
    const goal = buckets.find(b => b.id === goalId);
    if (!goal) return;

    try {
      await apiCall(`/api/buckets/${goalId}/fund`, {
        method: 'POST',
        body: JSON.stringify({ amount: amount.toFixed(4) }),
      });
      await loadAccounts();
      await loadBuckets();
    } catch (err) {
      console.error('Failed to add to goal:', err);
      setApiError({
        title: 'Failed to Lock Funds',
        message: (err as Error).message,
      });
    }
  };

  const updateBucketDescription = async (id: number, description: string) => {
    try {
      await apiCall(`/api/buckets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
      });
      await loadBuckets();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  const releaseBucketFunds = async (id: number, amount: number) => {
    if (amount <= 0) return { success: false, error: 'Enter a valid amount.' };
    try {
      await apiCall(`/api/buckets/${id}/release`, {
        method: 'POST',
        body: JSON.stringify({ amount: amount.toFixed(4) }),
      });
      await loadAccounts();
      await loadBuckets();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  const getBucketTransactions = async (id: number) => {
    try {
      const res = await apiCall(`/api/buckets/${id}/transactions`);
      return res.transactions || [];
    } catch (err) {
      console.error('Failed to load transactions:', err);
      return [];
    }
  };

  return (
    <BucketsContext.Provider
      value={{
        buckets,
        isLoadingBuckets,
        loadBuckets,
        addBucket,
        deleteBucket,
        fundBucket,
        updateBucketDescription,
        releaseBucketFunds,
        getBucketTransactions,
      }}
    >
      {children}
    </BucketsContext.Provider>
  );
}

export function useBuckets() {
  const context = useContext(BucketsContext);
  if (context === undefined) {
    throw new Error('useBuckets must be used within a BucketsProvider');
  }
  return context;
}
