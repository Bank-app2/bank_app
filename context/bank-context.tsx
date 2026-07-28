import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  sendMoney: (recipient: string, amount: number, note: string) => { success: boolean; error?: string };
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
  const [balance, setBalance] = useState(105);
  const [payingOut, setPayingOut] = useState(275);
  const [saved, setSaved] = useState(120);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [faceIdOn, setFaceIdOn] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const [buckets, setBuckets] = useState<Bucket[]>([
    { id: 1, name: 'Electricity', category: 'bill', amount: 50, note: "Set aside and scheduled to pay on Aug 14. The money is reserved, not spendable, but hasn't been sent yet." },
    { id: 2, name: 'Water', category: 'bill', amount: 25, note: "Set aside and scheduled to pay on Aug 18. The money is reserved, not spendable, but hasn't been sent yet." },
    { id: 3, name: 'Rent', category: 'bill', amount: 200, note: 'Paid on Aug 1 — the money has already been sent.' },
    { id: 4, name: 'Groceries', category: 'saving', amount: 50, note: 'Held for you, spendable anytime.' },
    { id: 5, name: 'Taxes', category: 'saving', amount: 30, note: 'Held for you, spendable anytime.' },
    { id: 6, name: 'Phone', category: 'goal', current: 40, target: 150, note: "Locked until the goal is reached — you'll get a notification the moment it unlocks." },
  ]);

  const [activity, setActivity] = useState<Transaction[]>([
    { id: 1, label: 'Electricity', sub: 'scheduled for the 14th', amount: -50, category: 'bill' },
    { id: 2, label: 'Phone goal', sub: '$80 to go', amount: -40, category: 'goal' },
    { id: 3, label: 'Paycheck received', sub: '', amount: 500, category: 'income' },
  ]);

  const [chat, setChat] = useState<ChatMessage[]>([
    { id: 0, from: 'zara', text: "Hey, I'm Zara. What can I do for you today?", isZara: true, isUser: false },
    { id: 1, from: 'user', text: "$50 for electricity", isZara: false, isUser: true },
    { id: 2, from: 'zara', text: "Done — $50.00 for Electricity. I'll pay that automatically when it's due.", isZara: true, isUser: false },
  ]);

  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([
    { id: 1, label: 'Visa •••• 4242' },
    { id: 2, label: 'Mastercard •••• 8831' },
  ]);

  const toggleBalanceHidden = () => setBalanceHidden(!balanceHidden);
  const toggleNotifications = () => setNotificationsOn(!notificationsOn);
  const toggleFaceId = () => setFaceIdOn(!faceIdOn);

  const addBucket = (name: string, category: 'bill' | 'saving' | 'goal', amount: number, date?: string, target?: number, starting?: number) => {
    const newId = Date.now();
    const cleanName = name.trim() || 'New Bucket';
    
    let note = '';
    if (category === 'bill') {
      note = `Set aside and scheduled to pay${date ? ' on ' + date : ' soon'}. The money is reserved, not spendable, but hasn't been sent yet.`;
    } else if (category === 'saving') {
      note = 'Held for you, spendable anytime.';
    } else {
      note = "Locked until the goal is reached — you'll get a notification the moment it unlocks.";
    }

    const newBucket: Bucket = category === 'goal'
      ? { id: newId, name: cleanName, category, current: starting || 0, target: target || Math.max(amount * 3, amount + 50), note }
      : { id: newId, name: cleanName, category, amount, note, date };

    setBuckets(prev => [...prev, newBucket]);

    // Update totals
    if (category === 'bill') {
      setPayingOut(prev => prev + amount);
    } else if (category === 'saving') {
      setSaved(prev => prev + amount);
    } else {
      setSaved(prev => prev + (starting || 0));
    }

    // Add activity
    const newTx: Transaction = {
      id: Date.now(),
      label: cleanName,
      sub: category === 'goal' ? `${formatMoney((target || Math.max(amount * 3, amount + 50)) - (starting || 0))} to go` : (category === 'bill' ? 'scheduled' : 'saved'),
      amount: -amount,
      category,
    };
    setActivity(prev => [newTx, ...prev]);
  };

  const deleteBucket = (id: number) => {
    const bucket = buckets.find(b => b.id === id);
    if (!bucket) return;

    if (bucket.category === 'bill') {
      setPayingOut(prev => Math.max(0, prev - (bucket.amount || 0)));
    } else if (bucket.category === 'saving') {
      setSaved(prev => Math.max(0, prev - (bucket.amount || 0)));
    } else if (bucket.category === 'goal') {
      setSaved(prev => Math.max(0, prev - (bucket.current || 0)));
    }

    setBuckets(prev => prev.filter(b => b.id !== id));
  };

  const topUp = (amount: number, source: 'bank' | 'card') => {
    if (amount <= 0) return;
    setBalance(prev => prev + amount);
    
    const newTx: Transaction = {
      id: Date.now(),
      label: 'Top up',
      sub: source === 'bank' ? 'via bank' : 'via card',
      amount: amount,
      category: 'income',
    };
    setActivity(prev => [newTx, ...prev]);
  };

  const sendMoney = (recipient: string, amount: number, note: string) => {
    const cleanRecipient = recipient.trim();
    if (!cleanRecipient) return { success: false, error: 'Add a recipient.' };
    if (amount <= 0) return { success: false, error: 'Enter an amount.' };
    if (amount > balance) return { success: false, error: "That's more than your available balance." };

    setBalance(prev => prev - amount);
    
    const newTx: Transaction = {
      id: Date.now(),
      label: `Sent to ${cleanRecipient}`,
      sub: note.trim() || 'transfer',
      amount: -amount,
      category: 'bill',
    };
    setActivity(prev => [newTx, ...prev]);
    return { success: true };
  };

  const addPaymentCard = () => {
    const newId = Date.now();
    const newCard: PaymentCard = {
      id: newId,
      label: 'Visa •••• ' + Math.floor(1000 + Math.random() * 9000),
    };
    setPaymentCards(prev => [...prev, newCard]);
  };

  const addToGoal = (goalId: number, amount: number) => {
    setBuckets(prev =>
      prev.map(b => {
        if (b.id === goalId && b.category === 'goal') {
          const current = Math.min(b.target || 0, (b.current || 0) + amount);
          return { ...b, current };
        }
        return b;
      })
    );

    const g = buckets.find(b => b.id === goalId);
    if (!g) return;

    setSaved(prev => prev + amount);

    const newTx: Transaction = {
      id: Date.now(),
      label: g.name,
      sub: `${formatMoney((g.target || 0) - ((g.current || 0) + amount))} to go`,
      amount: -amount,
      category: 'goal',
    };
    setActivity(prev => [newTx, ...prev]);
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

  const applyNlpBucket = (p: { name: string; cat: 'bill' | 'saving' | 'goal'; amount: number }) => {
    setBuckets(prevBuckets => {
      const idx = prevBuckets.findIndex(b => b.name.toLowerCase() === p.name.toLowerCase());
      let payingOutDelta = 0;
      let savedDelta = 0;
      const updatedBuckets = prevBuckets.map(b => ({ ...b }));

      if (idx >= 0) {
        const old = updatedBuckets[idx];
        if (old.category === 'bill') payingOutDelta -= old.amount || 0;
        else if (old.category === 'saving') savedDelta -= old.amount || 0;
        else if (old.category === 'goal') savedDelta -= old.current || 0;

        if (p.cat === 'goal') {
          const target = old.target || Math.max(p.amount * 3, p.amount + 50);
          const current = (old.category === 'goal' ? (old.current || 0) : 0) + p.amount;
          updatedBuckets[idx] = {
            ...old,
            category: 'goal',
            current,
            target,
            note: old.note || "Locked until the goal is reached — you'll get a notification the moment it unlocks."
          };
          savedDelta += current;
        } else {
          updatedBuckets[idx] = {
            ...old,
            category: p.cat,
            amount: p.amount,
            note: p.cat === 'bill' 
              ? `Set aside and scheduled to pay soon. The money is reserved, not spendable, but hasn't been sent yet.`
              : 'Held for you, spendable anytime.'
          };
          if (p.cat === 'bill') payingOutDelta += p.amount;
          else savedDelta += p.amount;
        }
      } else {
        const newId = Date.now();
        if (p.cat === 'goal') {
          const target = Math.max(p.amount * 3, p.amount + 50);
          updatedBuckets.push({
            id: newId,
            name: p.name,
            category: 'goal',
            current: p.amount,
            target,
            note: "Locked until the goal is reached — you'll get a notification the moment it unlocks."
          });
          savedDelta += p.amount;
        } else {
          updatedBuckets.push({
            id: newId,
            name: p.name,
            category: p.cat,
            amount: p.amount,
            note: p.cat === 'bill'
              ? `Set aside and scheduled to pay soon. The money is reserved, not spendable, but hasn't been sent yet.`
              : 'Held for you, spendable anytime.'
          });
          if (p.cat === 'bill') payingOutDelta += p.amount;
          else savedDelta += p.amount;
        }
      }

      setPayingOut(prev => Math.max(0, prev + payingOutDelta));
      setSaved(prev => Math.max(0, prev + savedDelta));

      const finalBucket = updatedBuckets[idx >= 0 ? idx : updatedBuckets.length - 1];
      const newTx: Transaction = {
        id: Date.now() + 1,
        label: finalBucket.name,
        sub: finalBucket.category === 'goal' 
          ? `${formatMoney((finalBucket.target || 0) - (finalBucket.current || 0))} to go` 
          : (finalBucket.category === 'bill' ? 'scheduled' : 'saved'),
        amount: -(finalBucket.category === 'goal' ? p.amount : (finalBucket.amount || 0)),
        category: finalBucket.category,
      };
      setActivity(prev => [newTx, ...prev]);

      return updatedBuckets;
    });
  };

  const sendChatMessage = (text: string) => {
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

    applyNlpBucket(parsed);
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
