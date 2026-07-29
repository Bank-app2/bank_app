import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/expo';
import { CustomAlert } from '@/components/custom-alert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Recurrence = 'once' | 'monthly' | 'quarterly' | 'annually';

export interface Bucket {
  id: number;
  name: string;
  category: 'bill' | 'saving' | 'goal';
  amount?: number; // For bills and savings
  current?: number; // For goals
  target?: number; // For goals
  note: string;
  date?: string; // For bills
  recurrence?: Recurrence; // NEW — how often this bucket repeats
  dueDate?: string; // NEW — when the next occurrence is due
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
  addBucket: (
    name: string,
    category: 'bill' | 'saving' | 'goal',
    amount: number,
    date?: string,
    target?: number,
    starting?: number,
    recurrence?: Recurrence,
    dueDate?: string
  ) => void;
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

// Category keywords used when a message doesn't match one of the KNOWN
// shortcuts above — this is the "look for certain keywords" logic.
const CATEGORY_KEYWORDS: { pattern: RegExp; category: Bucket['category'] }[] = [
  { pattern: /\bgoal\b|save up for|saving for|new phone|vacation/, category: 'goal' },
  { pattern: /\brent\b|electric|water|utilit|\bbill\b|subscription/, category: 'bill' },
  { pattern: /\bsaving(s)?\b|salary|income|paycheck/, category: 'saving' },
];

// Recurrence keywords — "once every month/3 months/year" etc.
const RECURRENCE_PATTERNS: { pattern: RegExp; value: Recurrence }[] = [
  { pattern: /every\s*3\s*months?|quarterly|every\s*quarter/, value: 'quarterly' },
  { pattern: /every\s*year|annually|yearly|once a year/, value: 'annually' },
  { pattern: /every\s*month|monthly|once a month/, value: 'monthly' },
];

// Percent-of-income phrasing — "20% of my salary goes to rent"
const PERCENT_PATTERN = /(\d+(?:\.\d+)?)\s*%/;

function formatMoney(n: number) {
  return '$' + Number(n).toFixed(2);
}

export function BankProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const [balance, setBalance] = useState(0);
  const [payingOut, setPayingOut] = useState(0);
  const [saved, setSaved] = useState(0);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [activity, setActivity] = useState<Transaction[]>([]);

  const [checkingAccountId, setCheckingAccountId] = useState<number | null>(null);
  const [savingsAccountId, setSavingsAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<{ title: string; message: string } | null>(null);

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

  const loadingRef = useRef(false);
  const loadData = useCallback(async () => {
    if (!isSignedIn || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
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
      }

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

      // Parse recurrence/dueDate back out of the description string, since the
      // backend doesn't have dedicated columns for them yet (see note in addBucket).
      const parseRecurrenceFromDescription = (description: string): Recurrence => {
        const lower = (description || '').toLowerCase();
        const match = RECURRENCE_PATTERNS.find(r => r.pattern.test(lower));
        return match ? match.value : 'once';
      };

      const activeBuckets: Bucket[] = [];
      rawTxList.forEach((t: any) => {
        if (t.type === 'withdrawal' && t.status === 'pending') {
          activeBuckets.push({
            id: t.id,
            name: (t.description || 'Bill Payment').replace(/\s*\(repeats.*?\)/i, ''),
            category: 'bill',
            amount: parseFloat(t.amount),
            note: `Set aside and scheduled. The money is reserved, not spendable, but hasn't been sent yet.`,
            recurrence: parseRecurrenceFromDescription(t.description),
            dueDate: t.dueDate,
          });
        } else if (t.type === 'transfer' && t.toAccountId === savings.id) {
          const goalName = (t.description || 'Savings Goal').replace(/\s*\(repeats.*?\)/i, '');
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
              recurrence: parseRecurrenceFromDescription(t.description),
            });
          }
        }
      });

      setBuckets(activeBuckets);

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

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

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

      setBalance(0);
      setPayingOut(0);
      setSaved(0);
      setBuckets([]);
      setActivity([]);
      setCheckingAccountId(null);
      setSavingsAccountId(null);
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
    dueDate?: string
  ) => {
    if (!checkingAccountId || !savingsAccountId) return;
    const cleanName = name.trim() || 'New Bucket';
    // NOTE: the backend schema doesn't have dedicated recurrence/dueDate columns
    // yet, so this bakes recurrence into the description string as a stopgap —
    // loadData() parses it back out on the next refresh. If you want true
    // auto-repeating bills/goals (the payment or lock actually re-firing every
    // cycle on its own), that needs a backend field plus a scheduled job —
    // this only remembers *what the cadence should be*, it doesn't re-trigger it.
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
            description: `${cleanName}${recurrenceSuffix}`,
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

  const addPaymentCard = () => {
    const newId = Date.now();
    const newCard: PaymentCard = {
      id: newId,
      label: 'Visa •••• ' + Math.floor(1000 + Math.random() * 9000),
    };
    setPaymentCards(prev => [...prev, newCard]);
  };

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

  // ── NLP-ish chat parser ──────────────────────────────────────────────
  // This is the piece that "looks for certain keywords" you asked about.
  // It pulls out: an amount (or a percent), a recurrence cadence, and a
  // category (bill / saving / goal) from a single free-text message like:
  //   "$100 of my salary goes into rent, every month"
  //   "create a rent bill of $900 due the 1st, monthly"
  //   "save $50 a month toward a new phone" (goal)
  const parseChatMessage = (text: string) => {
    const lower = text.toLowerCase();

    const percentMatch = text.match(PERCENT_PATTERN);
    const amountMatch = text.match(/\$?(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const percent = percentMatch ? parseFloat(percentMatch[1]) : null;

    // If they said "X% of my salary/income", resolve the percent against
    // current balance so "20% of my income" becomes a real dollar figure.
    const resolvedAmount = percent !== null ? (percent / 100) * balance : amount;

    const recurrenceMatch = RECURRENCE_PATTERNS.find(r => r.pattern.test(lower));
    const recurrence: Recurrence = recurrenceMatch?.value ?? 'once';

    const found = KNOWN.find(k => lower.includes(k.key));
    const catMatch = CATEGORY_KEYWORDS.find(c => c.pattern.test(lower));
    const category: Bucket['category'] = found?.cat ?? catMatch?.category ?? 'bill';

    let m = lower.match(/(?:create|make|add|set up|start)\s+(?:a |an |new )?(.+?)\s+(?:bill|bucket|goal|saving)/);
    let name = m ? m[1] : (found?.name ?? null);
    if (!name) {
      m = lower.match(/for\s+(.+?)(?:\.|,|$)/);
      name = m ? m[1] : null;
    }
    if (!name) m = lower.match(/toward(?:s)?\s+(?:a |an |my )?(.+?)(?:\.|,|$)/), name = name || (m ? m[1] : null);
    if (!name) name = 'New bucket';

    name = name.replace(/\$?\d+(\.\d+)?\s*%?\s*(dollars?)?/g, '').trim();
    name = name.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'New bucket';

    return { name, cat: category, amount: resolvedAmount, recurrence };
  };

  const sendChatMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const parsed = parseChatMessage(cleanText);
    const recurrenceText = parsed.recurrence !== 'once' ? ` It'll repeat ${parsed.recurrence}.` : '';

    let responseText = '';
    if (parsed.cat === 'goal') {
      responseText = `Done — ${formatMoney(parsed.amount)} added toward ${parsed.name}.${recurrenceText} I'll keep it locked until you hit the goal.`;
    } else if (parsed.cat === 'saving') {
      responseText = `Done — ${formatMoney(parsed.amount)} moved to savings for ${parsed.name}.${recurrenceText}`;
    } else {
      responseText = `Done — ${formatMoney(parsed.amount)} for ${parsed.name}.${recurrenceText} I'll pay that automatically when it's due.`;
    }

    setChat(prev => [
      ...prev,
      { id: prev.length, from: 'user', text: cleanText, isUser: true, isZara: false },
      { id: prev.length + 1, from: 'zara', text: responseText, isUser: false, isZara: true },
    ]);

    await addBucket(parsed.name, parsed.cat, parsed.amount, undefined, undefined, parsed.amount, parsed.recurrence);
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