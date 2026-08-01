import React, { ReactNode } from 'react';
import { SettingsProvider } from '@/features/settings/context/SettingsContext';
import { AccountsProvider } from '@/features/accounts/context/AccountsContext';
import { BucketsProvider } from '@/features/buckets/context/BucketsContext';
import { TransactionsProvider } from '@/features/transactions/context/TransactionsContext';
import { ChatProvider } from '@/features/chat/context/ChatContext';
import { ZaraProvider } from '@/features/zara/context/ZaraContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <AccountsProvider>
        <BucketsProvider>
          <TransactionsProvider>
            <ChatProvider>
              <ZaraProvider>
                {children}
              </ZaraProvider>
            </ChatProvider>
          </TransactionsProvider>
        </BucketsProvider>
      </AccountsProvider>
    </SettingsProvider>
  );
}
