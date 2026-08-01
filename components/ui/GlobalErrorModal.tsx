import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAccounts } from '@/features/accounts/context/AccountsContext';

export function GlobalErrorModal() {
  const { apiError, setApiError } = useAccounts();

  if (!apiError) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!apiError}
      onRequestClose={() => setApiError(null)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{apiError.title}</Text>
          <Text style={styles.message}>{apiError.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setApiError(null)}>
            <Text style={styles.buttonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 15, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6F6F68',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    height: 52,
    backgroundColor: '#10201B',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
