import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useBuckets, Recurrence } from '@/features/buckets/context/BucketsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';


const RECURRENCE_OPTIONS: { key: Recurrence; label: string }[] = [
  { key: 'once', label: 'One-time' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly (3mo)' },
  { key: 'annually', label: 'Annually' },
];

export default function BucketsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    buckets,
    addBucket,
    deleteBucket,
    addToGoal,
    isLoadingBuckets: isLoading,
  } = useBuckets();

  // Local state
  const [activeTab, setActiveTab] = useState<'bill' | 'saving' | 'goal'>('bill');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New bucket form state
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<'bill' | 'saving' | 'goal'>('bill');
  const [newDueDate, setNewDueDate] = useState('');
  const [newStarting, setNewStarting] = useState('');
  const [newRecurrence, setNewRecurrence] = useState<Recurrence>('monthly');

  // Format currency helper
  const formatMoney = (n: number) => {
    return '$' + Number(n).toFixed(2);
  };

  const filteredBuckets = buckets.filter(b => b.category === activeTab);

  // Calculate totals
  const billCountLabel = filteredBuckets.length === 1 ? '1 bill' : `${filteredBuckets.length} bills`;
  const savingCountLabel = filteredBuckets.length === 1 ? '1 saving bucket' : `${filteredBuckets.length} saving buckets`;
  const goalCountLabel = filteredBuckets.length === 1 ? '1 locked goal' : `${filteredBuckets.length} locked goals`;

  // Goal metrics
  const rawGoals = buckets.filter(b => b.category === 'goal');
  const totalGoalTarget = rawGoals.reduce((sum, b) => sum + (b.target || 0), 0);
  const totalGoalCurrent = rawGoals.reduce((sum, b) => sum + (b.current || 0), 0);
  const goalOverallPct = totalGoalTarget > 0 ? Math.min(100, Math.round((totalGoalCurrent / totalGoalTarget) * 100)) : 0;

  const resetForm = () => {
    setNewName('');
    setNewAmount('');
    setNewCategory('bill');
    setNewDueDate('');
    setNewStarting('');
    setNewRecurrence('monthly');
  };

  const handleCreateBucket = () => {
    if (!newName.trim()) return;
    if ((newCategory === 'bill' || newCategory === 'goal') && !newAmount) return;
    const amt = parseFloat(newAmount) || 0;

    if (newCategory === 'goal') {
      const target = amt;
      const starting = parseFloat(newStarting) || 0;
      addBucket(newName, 'goal', 0, undefined, target, starting, newRecurrence, newDueDate.trim() || undefined);
    } else {
      addBucket(newName, newCategory, amt, newDueDate.trim() || undefined, undefined, amt, newRecurrence, newDueDate.trim() || undefined);
    }

    resetForm();
    setAddModalOpen(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: Math.max(insets.top, 20), paddingBottom: 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Buckets</Text>

        {/* TAB SELECTOR */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'bill' && styles.tabButtonActive]}
            onPress={() => setActiveTab('bill')}
          >
            <Text style={[styles.tabText, activeTab === 'bill' && styles.tabTextActive]}>Bills</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'saving' && styles.tabButtonActive]}
            onPress={() => setActiveTab('saving')}
          >
            <Text style={[styles.tabText, activeTab === 'saving' && styles.tabTextActive]}>Saving</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'goal' && styles.tabButtonActive]}
            onPress={() => setActiveTab('goal')}
          >
            <Text style={[styles.tabText, activeTab === 'goal' && styles.tabTextActive]}>Goals</Text>
          </TouchableOpacity>
        </View>

        {/* TAB ACTION HEADER */}
        <View style={styles.actionHeaderRow}>
          <View style={styles.countPill}>
            <View style={styles.countPillDot} />
            <Text style={styles.countPillText}>
              {activeTab === 'bill' ? billCountLabel : activeTab === 'saving' ? savingCountLabel : goalCountLabel}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setNewCategory(activeTab);
              setAddModalOpen(true);
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* DETAILS LIST */}
        {activeTab === 'goal' && rawGoals.length > 0 && (
          <View style={styles.overallGoalCard}>
            <Text style={styles.overallGoalTitle}>Total locked</Text>
            <Text style={styles.overallGoalValue}>{formatMoney(totalGoalCurrent)}</Text>

            <View style={styles.donutContainer}>
              <View style={styles.donutRing}>
                <View style={styles.donutCenter}>
                  <Text style={styles.donutText}>{goalOverallPct}%</Text>
                  <Text style={styles.donutSubText}>completed</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={[styles.emptyContainer, { paddingVertical: 100 }]}>
              <ActivityIndicator size="large" color="#10201B" />
            </View>
          ) : filteredBuckets.length > 0 ? (
            filteredBuckets.map((bucket) => {
              const letter = bucket.name.charAt(0).toUpperCase();
              const progressPct = bucket.category === 'goal' && bucket.target
                ? Math.min(100, Math.round(((bucket.current || 0) / bucket.target) * 100))
                : 0;
              const recurrenceLabel = bucket.recurrence && bucket.recurrence !== 'once'
                ? RECURRENCE_OPTIONS.find(r => r.key === bucket.recurrence)?.label
                : null;

              return (
                <TouchableOpacity
                  key={bucket.id}
                  style={styles.bucketCard}
                  onPress={() => router.push({ pathname: '/bucket-detail', params: { id: bucket.id } })}
                >
                  <View style={styles.bucketHeader}>
                    {bucket.category === 'goal' ? (
                      <View style={styles.progressCircle}>
                        <Text style={styles.progressCircleText}>{progressPct}%</Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: bucket.category === 'bill' ? '#C5F347' : '#ECEEE4' }
                        ]}
                      >
                        <Text style={styles.avatarCircleText}>{letter}</Text>
                      </View>
                    )}
                    <View style={styles.bucketInfo}>
                      <Text style={styles.bucketName}>{bucket.name}</Text>
                      {bucket.category === 'goal' ? (
                        <Text style={styles.bucketAmount}>
                          {formatMoney(bucket.current || 0)} / {formatMoney(bucket.target || 0)}
                        </Text>
                      ) : (
                        <Text style={styles.bucketAmount}>
                          {formatMoney(bucket.amount || 0)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.bucketNote}>{bucket.description}</Text>
                  {recurrenceLabel && (
                    <View style={styles.recurrencePill}>
                      <Text style={styles.recurrencePillText}>Repeats {recurrenceLabel.toLowerCase()}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <IconSymbol
                  name={activeTab === 'bill' ? 'doc.text' : activeTab === 'saving' ? 'archivebox' : 'lock'}
                  size={48}
                  color="#10201B4D"
                />
              </View>
              <Text style={styles.emptyTitle}>
                No {activeTab === 'bill' ? 'bills' : activeTab === 'saving' ? 'savings' : 'locked goals'} yet
              </Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button above to create a new {activeTab === 'bill' ? 'bill schedule' : activeTab === 'saving' ? 'saving envelope' : 'savings goal'}.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ADD BUCKET MODAL */}
      <Modal
        visible={addModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              New {newCategory === 'bill' ? 'bill' : newCategory === 'saving' ? 'saving' : 'goal'}
            </Text>

            {/* FIELD: NAME */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Internet"
                placeholderTextColor="#9A9A90"
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            {/* DYNAMIC FORM FIELDS */}
            {newCategory === 'bill' && (
              <>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Amount</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="0"
                    placeholderTextColor="#9A9A90"
                    keyboardType="numeric"
                    value={newAmount}
                    onChangeText={setNewAmount}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Due date</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Aug 14"
                    placeholderTextColor="#9A9A90"
                    value={newDueDate}
                    onChangeText={setNewDueDate}
                  />
                </View>
              </>
            )}

            {newCategory === 'goal' && (
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Target amount</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="150"
                  placeholderTextColor="#9A9A90"
                  keyboardType="numeric"
                  value={newAmount}
                  onChangeText={setNewAmount}
                />
              </View>
            )}

            {/* RECURRENCE — same question for bills, savings, and goals:
                "is this monthly, quarterly, annually, or one-time?" */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>
                {newCategory === 'bill' ? 'How often does this bill repeat?' : 'How often should this be funded?'}
              </Text>
              <View style={styles.recurrenceRow}>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.recurrenceChip, newRecurrence === opt.key && styles.recurrenceChipActive]}
                    onPress={() => setNewRecurrence(opt.key)}
                  >
                    <Text style={[styles.recurrenceChipText, newRecurrence === opt.key && styles.recurrenceChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* BUTTONS BAR */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setAddModalOpen(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleCreateBucket}
              >
                <Text style={styles.modalButtonConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4EE', // Warm Beige
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 18,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#10201B', // Dark Pine Green
    borderRadius: 25,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 21,
  },
  tabButtonActive: {
    backgroundColor: '#C5F347', // Lime Green
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabTextActive: {
    color: '#10201B',
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  countPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10201B',
  },
  countPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10201B',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#10201B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  overallGoalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
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
  overallGoalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F6F68',
    marginBottom: 4,
  },
  overallGoalValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10201B',
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  donutRing: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#ECEEE4',
    borderWidth: 20,
    borderColor: '#C5F347',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10201B',
  },
  donutSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A9A3F',
    marginTop: 2,
  },
  listContainer: {
    gap: 10,
  },
  bucketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
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
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleText: {
    fontWeight: '800',
    fontSize: 16,
    color: '#10201B',
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECEEE4',
    borderWidth: 6,
    borderColor: '#10201B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10201B',
  },
  bucketInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bucketName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10201B',
  },
  bucketAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10201B',
  },
  bucketNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#9A9A90',
    fontWeight: '500',
    lineHeight: 16,
  },
  recurrencePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#ECEEE4',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  recurrencePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A9A3F',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ECEEE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10201B',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#10201B99',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 15, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 16,
  },
  modalField: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F6F68',
    marginBottom: 6,
  },
  modalInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ECEEE4',
    fontSize: 14,
    color: '#10201B',
  },
  recurrenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrenceChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#ECEEE4',
  },
  recurrenceChipActive: {
    backgroundColor: '#C5F347',
  },
  recurrenceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F6F68',
  },
  recurrenceChipTextActive: {
    color: '#10201B',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#ECEEE4',
  },
  modalButtonCancelText: {
    color: '#10201B',
    fontWeight: '700',
    fontSize: 15,
  },
  modalButtonConfirm: {
    backgroundColor: '#10201B',
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});