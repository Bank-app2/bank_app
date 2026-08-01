import { useCallback, useRef } from 'react';
import { useAuth } from '@clerk/expo';

export function useApi() {
  const { getToken, signOut } = useAuth();
  
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  const apiCall = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = await getTokenRef.current();
    
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    };
    
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      if (response.status === 401) {
        await signOutRef.current();
      }
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }, []);

  return apiCall;
}
