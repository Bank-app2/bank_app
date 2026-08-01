import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

interface SettingsContextType {
  balanceHidden: boolean;
  notificationsOn: boolean;
  faceIdOn: boolean;
  isSettingsLoaded: boolean;
  toggleBalanceHidden: () => void;
  toggleNotifications: () => void;
  toggleFaceId: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [faceIdOn, setFaceIdOn] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedFaceId = await SecureStore.getItemAsync('faceIdOn');
        if (storedFaceId !== null) {
          setFaceIdOn(storedFaceId === 'true');
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const toggleBalanceHidden = () => setBalanceHidden(!balanceHidden);
  const toggleNotifications = () => setNotificationsOn(!notificationsOn);

  const toggleFaceId = async () => {
    if (!faceIdOn) {
      // Trying to turn it ON
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Unavailable', 'Biometric authentication is not set up or not available on this device.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Face ID',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setFaceIdOn(true);
        await SecureStore.setItemAsync('faceIdOn', 'true');
      }
    } else {
      // Turning it OFF
      setFaceIdOn(false);
      await SecureStore.setItemAsync('faceIdOn', 'false');
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        balanceHidden,
        notificationsOn,
        faceIdOn,
        isSettingsLoaded,
        toggleBalanceHidden,
        toggleNotifications,
        toggleFaceId,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
