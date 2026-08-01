import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAccounts } from '@/features/accounts/context/AccountsContext';

export function GlobalErrorModal() {
  const { apiError, setApiError } = useAccounts();

  useEffect(() => {
    if (apiError) {
      Alert.alert(
        apiError.title,
        apiError.message,
        [
          {
            text: 'Dismiss',
            onPress: () => setApiError(null),
          },
        ]
      );
    }
  }, [apiError, setApiError]);

  return null;
}
