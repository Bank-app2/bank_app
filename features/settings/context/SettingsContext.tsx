import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  balanceHidden: boolean;
  notificationsOn: boolean;
  faceIdOn: boolean;
  toggleBalanceHidden: () => void;
  toggleNotifications: () => void;
  toggleFaceId: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [faceIdOn, setFaceIdOn] = useState(false);

  const toggleBalanceHidden = () => setBalanceHidden(!balanceHidden);
  const toggleNotifications = () => setNotificationsOn(!notificationsOn);
  const toggleFaceId = () => setFaceIdOn(!faceIdOn);

  return (
    <SettingsContext.Provider
      value={{
        balanceHidden,
        notificationsOn,
        faceIdOn,
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
