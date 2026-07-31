import { useCallback } from 'react';
import { useAuth } from '@clerk/expo';

export function useApi() {
  const { getToken } = useAuth();

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

  return apiCall;
}
