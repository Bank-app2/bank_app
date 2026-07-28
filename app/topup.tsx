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
import { useBank } from '@/context/bank-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { topUp, paymentCards } = useBank();

  // Local state
  const [amount, setAmount] = useState('');
  const [fundingSource, setFundingSource] = useState<'bank' | 'card'>('bank');

  const formatMoney = (n: number) => {
    return '$' + Number(n).toFixed(2);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const cardLabel = paymentCards[0]?.label || 'Card';

  const handleConfirm = () => {
    if (parsedAmount <= 0) return;
    topUp(parsedAmount, fundingSource);
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 20) }]}>
          <Text style={styles.headerTitle}>Top up</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* AMOUNT INPUT BLOCK */}
          <View style={styles.amountBlock}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#9A9A90"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          {/* CHIP PRESETS */}
          <View style={styles.chipsRow}>
            {[20, 50, 100, 200].map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.chip}
                onPress={() => setAmount(String(val))}
              >
                <Text style={styles.chipText}>+${val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FUNDING SOURCE */}
          <Text style={styles.sectionLabel}>Funding source</Text>
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                fundingSource === 'bank' && styles.segmentButtonActive
              ]}
              onPress={() => setFundingSource('bank')}
            >
              <Text 
                style={[
                  styles.segmentText,
                  fundingSource === 'bank' && styles.segmentTextActive
                ]}
              >
                Bank Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                fundingSource === 'card' && styles.segmentButtonActive
              ]}
              onPress={() => setFundingSource('card')}
            >
              <Text 
                style={[
                  styles.segmentText,
                  fundingSource === 'card' && styles.segmentTextActive
                ]}
              >
                {cardLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONFIRM BUTTON */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={[styles.confirmButton, parsedAmount <= 0 && { opacity: 0.5 }]}
            disabled={parsedAmount <= 0}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              Top up {parsedAmount > 0 ? formatMoney(parsedAmount) : ''}
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
    backgroundColor: '#FFFFFF', // Clean White background
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
    paddingTop: 36,
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  inputPrefix: {
    fontSize: 48,
    fontWeight: '800',
    color: '#10201B',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '800',
    color: '#10201B',
    minWidth: 120,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 36,
  },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECEEE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10201B',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F6F68',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#ECEEE4',
    borderRadius: 20,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F6F68',
  },
  segmentTextActive: {
    color: '#10201B',
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
