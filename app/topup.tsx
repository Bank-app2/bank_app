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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { useAccounts } from '@/features/accounts/context/AccountsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { topUp } = useAccounts();

  const [amount, setAmount] = useState('');
  const [fundingSource, setFundingSource] = useState<'bank' | 'card'>('bank');

  const avatarUrl = user?.imageUrl || null;
  const parsedAmount = parseFloat(amount) || 0;

  const formatMoney = (n: number) => {
    return '$' + Number(n).toFixed(2);
  };

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 20), paddingBottom: 40 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerNavRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹ Back</Text>
            </TouchableOpacity>
            {avatarUrl && (
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              </View>
            )}
          </View>

          <Text style={styles.pageTitle}>Top up</Text>

          <View style={styles.amountCard}>
            <Text style={styles.amountCardLabel}>Amount to add</Text>
            <Text style={styles.amountCardValue}>
              {formatMoney(parsedAmount)}
            </Text>
          </View>

          <View style={styles.chipsRow}>
            {[20, 50, 100, 200].map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.chip}
                onPress={() => setAmount(String(val))}
              >
                <Text style={styles.chipText}>${val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputFieldBlock}>
            <Text style={styles.sectionLabel}>Or enter amount</Text>
            <TextInput
              style={styles.textInputCapsule}
              placeholder="0"
              placeholderTextColor="#9A9A90"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={styles.fundingBlock}>
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
                  Bank
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
                  Card
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, parsedAmount <= 0 && { opacity: 0.5 }]}
            disabled={parsedAmount <= 0}
            onPress={handleConfirm}
            activeOpacity={0.9}
          >
            <Text style={styles.confirmButtonText}>Add funds</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4EE',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  headerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10201B',
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECEEE4',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  amountCard: {
    backgroundColor: '#C5F347',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#10201B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  amountCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3d4a24',
    marginBottom: 6,
  },
  amountCardValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#10201B',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECEEE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10201B',
  },
  inputFieldBlock: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F6F68',
    marginBottom: 8,
  },
  textInputCapsule: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECEEE4',
    paddingHorizontal: 18,
    fontSize: 14,
    color: '#10201B',
    fontWeight: '600',
  },
  fundingBlock: {
    marginBottom: 32,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#ECEEE4',
    borderRadius: 24,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#6F6F68',
  },
  segmentTextActive: {
    color: '#10201B',
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