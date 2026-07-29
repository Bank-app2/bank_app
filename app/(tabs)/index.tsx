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
import { useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { useBank } from '@/context/bank-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TX_PAGE_SIZE = 4;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const {
    balance,
    payingOut,
    saved,
    activity,
    balanceHidden,
    toggleBalanceHidden,
  } = useBank();

  const [txPage, setTxPage] = React.useState(0);

  const firstName = user?.firstName || 'there';
  const avatarUrl = user?.imageUrl || null;

  const formatMoney = (n: number) => {
    return '$' + Number(n).toFixed(2);
  };

  const processedActivity = activity.map(a => {
    const isIncome = a.category === 'income';
    const bg = a.category === 'bill' ? '#C5F347' : a.category === 'saving' ? '#ECEEE4' : '#10201B';
    const color = a.category === 'bill' || a.category === 'saving' ? '#10201B' : '#FFFFFF';
    return {
      ...a,
      letter: a.label.charAt(0).toUpperCase(),
      avatarBg: bg,
      avatarColor: color,
      amountDisplay: (a.amount >= 0 ? '+' : '-') + formatMoney(Math.abs(a.amount)),
      amountColor: isIncome ? '#10201B' : '#E1483F',
    };
  });

  const txTotalPages = Math.max(1, Math.ceil(processedActivity.length / TX_PAGE_SIZE));
  const activeTxPage = Math.min(txPage, txTotalPages - 1);
  const pagedActivity = processedActivity.slice(activeTxPage * TX_PAGE_SIZE, activeTxPage * TX_PAGE_SIZE + TX_PAGE_SIZE);

  const txPrev = () => setTxPage(prev => Math.max(0, prev - 1));
  const txNext = () => setTxPage(prev => Math.min(txTotalPages - 1, prev + 1));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top, 20), paddingBottom: 100 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER SECTION */}
      <View style={styles.headerRow}>
        <Text style={styles.welcomeText}>Welcome, {firstName}</Text>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>{firstName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* BALANCE CARD BANNER */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeaderRow}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <TouchableOpacity onPress={toggleBalanceHidden} style={styles.eyeButton}>
            <IconSymbol
              name={balanceHidden ? "eye.slash.fill" : "eye.fill"}
              size={20}
              color="#10201B"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceValue}>
          {balanceHidden ? '••••••' : formatMoney(balance)}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryWidget}>
            <Text style={styles.summaryLabel}>Paying out</Text>
            <Text style={styles.summaryValue}>{formatMoney(payingOut)}</Text>
          </View>
          <View style={styles.summaryWidget}>
            <Text style={styles.summaryLabel}>Saved / locked</Text>
            <Text style={styles.summaryValue}>{formatMoney(saved)}</Text>
          </View>
        </View>
      </View>

      {/* QUICK ACTIONS BAR — "Receive" removed per request; Top up / Send / Payments remain */}
      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/topup')}>
          <View style={styles.actionIconContainer}>
            <IconSymbol name="arrow.up.circle" size={24} color="#10201B" />
          </View>
          <Text style={styles.actionLabel}>Top up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/send')}>
          <View style={styles.actionIconContainer}>
            <IconSymbol name="paperplane" size={22} color="#10201B" />
          </View>
          <Text style={styles.actionLabel}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/payments')}>
          <View style={styles.actionIconContainer}>
            <IconSymbol name="creditcard" size={22} color="#10201B" />
          </View>
          <Text style={styles.actionLabel}>Payments</Text>
        </TouchableOpacity>
      </View>

      {/* TRANSACTIONS SECTION */}
      <Text style={styles.sectionTitle}>Transactions</Text>
      <View style={styles.transactionsContainer}>
        {pagedActivity.length > 0 ? (
          pagedActivity.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.transactionRow,
                index === pagedActivity.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <View style={[styles.txAvatar, { backgroundColor: item.avatarBg }]}>
                <Text style={[styles.txAvatarText, { color: item.avatarColor }]}>
                  {item.letter}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txLabel}>{item.label}</Text>
                {item.sub ? <Text style={styles.txSub}>{item.sub}</Text> : null}
              </View>
              <Text style={[styles.txAmount, { color: item.amountColor }]}>
                {item.amountDisplay}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No transactions yet</Text>
        )}
      </View>

      {/* TRANSACTION PAGINATION DOTS */}
      {txTotalPages > 1 ? (
        <View style={styles.pagerContainer}>
          <TouchableOpacity
            style={[styles.pagerArrow, activeTxPage === 0 && { opacity: 0.4 }]}
            onPress={txPrev}
            disabled={activeTxPage === 0}
          >
            <Text style={styles.arrowText}>←</Text>
          </TouchableOpacity>
          <View style={styles.dotsRow}>
            {Array.from({ length: txTotalPages }).map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setTxPage(i)}
                style={[
                  styles.dot,
                  i === activeTxPage ? styles.activeDot : null
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.pagerArrow, activeTxPage >= txTotalPages - 1 && { opacity: 0.4 }]}
            onPress={txNext}
            disabled={activeTxPage >= txTotalPages - 1}
          >
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1EEE4',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10201B',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#10201B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#F1EEE4',
    fontSize: 14,
    fontWeight: '700',
  },
  balanceCard: {
    backgroundColor: '#C5F347',
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#10201B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  balanceLabel: {
    color: '#3d4a24',
    fontSize: 13,
    fontWeight: '600',
  },
  eyeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceValue: {
    fontSize: 38,
    fontWeight: '800',
    color: '#10201B',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryWidget: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6f6f68',
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10201B',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    marginBottom: 24,
  },
  actionItem: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECEEE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10201B',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 10,
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEFE8',
  },
  txAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txAvatarText: {
    fontWeight: '800',
    fontSize: 14,
  },
  txInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  txLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10201B',
  },
  txSub: {
    fontSize: 12,
    color: '#9A9A90',
    fontWeight: '500',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: '#9A9A90',
    fontWeight: '500',
  },
  pagerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  pagerArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECEEE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10201B',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    height: 7,
    width: 7,
    borderRadius: 3.5,
    backgroundColor: '#DCDED2',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#C5F347',
  },
});