import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBank } from '@/context/bank-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { paymentCards, addPaymentCard } = useBank();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Payments</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Linked cards</Text>
        <View style={styles.cardsList}>
          {paymentCards.map((card, index) => (
            <View 
              key={card.id} 
              style={[
                styles.cardRow, 
                index === paymentCards.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <View style={styles.cardIconBox}>
                <IconSymbol name="creditcard.fill" size={20} color="#10201B" />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.helperText}>These cards can be used to instantly top up your balance.</Text>
      </ScrollView>

      {/* FOOTER ACTION LINK CARD */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={addPaymentCard}
          activeOpacity={0.9}
        >
          <Text style={styles.linkButtonText}>Link another card</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F6F68',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  cardsList: {
    backgroundColor: '#F1EEE4',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10201B',
  },
  helperText: {
    fontSize: 13,
    color: '#9A9A90',
    fontWeight: '500',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  linkButton: {
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
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
