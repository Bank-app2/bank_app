import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAccounts } from '@/features/accounts/context/AccountsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { balance, sendMoney } = useAccounts();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const formatMoney = (n: number) => {
    return '$' + Number(n).toFixed(2);
  };

  const parsedAmount = parseFloat(amount) || 0;

  const handleSend = async () => {
    setError('');

    let cleanRecipient = recipient.trim();
    if (!cleanRecipient) {
      setError('Please enter a recipient tag.');
      return;
    }

    if (!cleanRecipient.startsWith('@')) {
      cleanRecipient = '@' + cleanRecipient;
    }

    if (parsedAmount <= 0) {
      setError('Please enter a valid transfer amount.');
      return;
    }

    if (parsedAmount > balance) {
      setError("That's more than your available balance.");
      return;
    }

    const result = await sendMoney(cleanRecipient, parsedAmount, note);
    if (result.success) {
      router.back();
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 20) }]}>
          <Text style={styles.headerTitle}>Send money</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available balance:</Text>
            <Text style={styles.balanceValue}>{formatMoney(balance)}</Text>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Recipient handle</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. @alexrivera"
              placeholderTextColor="#9A9A90"
              autoCapitalize="none"
              autoCorrect={false}
              value={recipient}
              onChangeText={(val) => {
                setError('');
                setRecipient(val);
              }}
            />
          </View>

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.textInput, { flex: 1, fontSize: 18, fontWeight: '700' }]}
                placeholder="0.00"
                placeholderTextColor="#9A9A90"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(val) => {
                  setError('');
                  setAmount(val);
                }}
              />
            </View>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Dinner share"
              placeholderTextColor="#9A9A90"
              value={note}
              onChangeText={setNote}
            />
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={[styles.confirmButton, (parsedAmount <= 0 || !recipient.trim()) && { opacity: 0.5 }]}
            disabled={parsedAmount <= 0 || !recipient.trim()}
            onPress={handleSend}
            activeOpacity={0.9}
          >
            <Text style={styles.confirmButtonText}>
              Send {parsedAmount > 0 ? formatMoney(parsedAmount) : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10201B',
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#ECEEE4',
  },
  closeButtonText: {
    color: '#10201B',
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1EEE4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6F6F68',
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10201B',
  },
  inputField: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F6F68',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ECEEE4',
    fontSize: 14,
    color: '#10201B',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEEE4',
    borderRadius: 20,
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10201B',
    marginRight: -8,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginTop: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  confirmButton: {
    backgroundColor: '#10201B',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#10201B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});