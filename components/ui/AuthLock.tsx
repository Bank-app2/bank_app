import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSettings } from '@/features/settings/context/SettingsContext';
import { IconSymbol } from './icon-symbol';
import { useAuth } from '@clerk/expo';

export function AuthLock({ children }: { children: ReactNode }) {
  const { faceIdOn, isSettingsLoaded } = useSettings();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const appState = useRef(AppState.currentState);

  const shouldLock = isSettingsLoaded && isAuthLoaded && isSignedIn && faceIdOn;

  const authenticate = async () => {
    if (!shouldLock) return;
    
    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock My Bank App',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsUnlocked(true);
      } else {
        setIsUnlocked(false);
      }
    } catch (err) {
      console.error('Biometric auth failed:', err);
      setIsUnlocked(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    // Initial check on mount if settings are loaded and user is signed in
    if (shouldLock && !isUnlocked && !isAuthenticating) {
      authenticate();
    }
  }, [shouldLock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // If the app goes to the background or inactive, we lock it (if Face ID is enabled).
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        if (shouldLock) {
          setIsUnlocked(false);
        }
      }

      // If the app comes to the foreground, prompt authentication
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (shouldLock && !isUnlocked && !isAuthenticating) {
          authenticate();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [shouldLock, isUnlocked, isAuthenticating]);

  // If Face ID is off, or user is not signed in, just render children directly.
  if (!shouldLock || isUnlocked) {
    return <>{children}</>;
  }

  // Otherwise, render the lock screen
  return (
    <View style={styles.container}>
      <IconSymbol name="lock.fill" size={64} color="#10201B" />
      <Text style={styles.title}>App Locked</Text>
      <Text style={styles.subtitle}>Use Face ID to unlock My Bank App</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={authenticate}
        disabled={isAuthenticating}
      >
        <Text style={styles.buttonText}>
          {isAuthenticating ? 'Authenticating...' : 'Unlock'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4EE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10201B',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6F6F68',
    marginBottom: 48,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#10201B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
