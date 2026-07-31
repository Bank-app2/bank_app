import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAccounts } from '@/features/accounts/context/AccountsContext';
import { useBuckets, Bucket, Recurrence } from '@/features/buckets/context/BucketsContext';

export interface ChatMessage {
  id: number;
  from: 'zara' | 'user';
  text: string;
  isZara: boolean;
  isUser: boolean;
}

interface ChatContextType {
  chat: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  sendChatMessage: (text: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const KNOWN = [
  { key: 'electric', name: 'Electricity', cat: 'bill' as const },
  { key: 'water', name: 'Water', cat: 'bill' as const },
  { key: 'rent', name: 'Rent', cat: 'bill' as const },
  { key: 'grocer', name: 'Groceries', cat: 'saving' as const },
  { key: 'tax', name: 'Taxes', cat: 'saving' as const },
  { key: 'phone', name: 'Phone', cat: 'goal' as const },
];

const CATEGORY_KEYWORDS: { pattern: RegExp; category: Bucket['category'] }[] = [
  { pattern: /\bgoal\b|save up for|saving for|new phone|vacation/, category: 'goal' },
  { pattern: /\brent\b|electric|water|utilit|\bbill\b|subscription/, category: 'bill' },
  { pattern: /\bsaving(s)?\b|salary|income|paycheck/, category: 'saving' },
];

const RECURRENCE_PATTERNS: { pattern: RegExp; value: Recurrence }[] = [
  { pattern: /every\s*3\s*months?|quarterly|every\s*quarter/, value: 'quarterly' },
  { pattern: /every\s*year|annually|yearly|once a year/, value: 'annually' },
  { pattern: /every\s*month|monthly|once a month/, value: 'monthly' },
];

const PERCENT_PATTERN = /(\d+(?:\.\d+)?)\s*%/;

function formatMoney(n: number) {
  return '$' + Number(n).toFixed(2);
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { balance } = useAccounts();
  const { addBucket } = useBuckets();

  const [chatInput, setChatInput] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([
    { id: 0, from: 'zara', text: "Hey, I'm Zara. What can I do for you today?", isZara: true, isUser: false },
  ]);

  const parseChatMessage = (text: string) => {
    const lower = text.toLowerCase();

    const percentMatch = text.match(PERCENT_PATTERN);
    const amountMatch = text.match(/\$?(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const percent = percentMatch ? parseFloat(percentMatch[1]) : null;

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
    <ChatContext.Provider
      value={{
        chat,
        chatInput,
        setChatInput,
        sendChatMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
