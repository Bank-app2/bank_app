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
  KeyboardAvoidingView,
} from 'react-native';
import { useBuckets, Recurrence } from '@/features/buckets/context/BucketsContext';
import { useTransactions } from '@/features/transactions/context/TransactionsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProgressCircle } from '@/components/ui/ProgressCircle';
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
    isLoadingBuckets: isLoading,
    getBillers,
    previewBill,
    connectBill,
  } = useBuckets();
  
  const { loadTransactions } = useTransactions();

  // Local state
  const [activeTab, setActiveTab] = useState<'bill' | 'saving' | 'goal'>('bill');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New bucket form state
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<'bill' | 'saving' | 'goal'>('bill');
  const [newDueDate, setNewDueDate] = useState('');
  const [newStarting, setNewStarting] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRecurrence, setNewRecurrence] = useState<Recurrence>('monthly');
  const [wizardStep, setWizardStep] = useState(0); // 0:Category, 1:Name, 2:Details/Connect, 3:Review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billerNetwork, setBillerNetwork] = useState('');
  const [billerAccountNumber, setBillerAccountNumber] = useState('');
  const [availableNetworks, setAvailableNetworks] = useState<string[]>([]);
  const [billPreview, setBillPreview] = useState<any>(null);

  React.useEffect(() => {
    if (addModalOpen && newCategory === 'bill') {
      getBillers().then(setAvailableNetworks);
    }
  }, [addModalOpen, newCategory, getBillers]);

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
    setNewDescription('');
    setNewRecurrence('monthly');
    setBillerNetwork('');
    setBillerAccountNumber('');
    setBillPreview(null);
    setWizardStep(1);
  };

  const handleCreateBucket = async () => {
    if (!newName.trim()) return;
    if ((newCategory === 'bill' || newCategory === 'goal') && !newAmount) return;
    const amt = parseFloat(newAmount) || 0;

    setIsSubmitting(true);
    try {
      let bucketId: number | undefined;
      if (newCategory === 'goal') {
        const target = amt;
        const starting = parseFloat(newStarting) || 0;
        bucketId = await addBucket(newName, 'goal', 0, undefined, target, starting, newRecurrence, newDueDate.trim() || undefined, newDescription.trim() || undefined);
      } else {
        bucketId = await addBucket(newName, newCategory, amt, newDueDate.trim() || undefined, undefined, amt, newRecurrence, newDueDate.trim() || undefined, newDescription.trim() || undefined);
      }

      // If it's a bill, we need to connect it to the mock provider
      if (newCategory === 'bill' && bucketId && billerNetwork && billerAccountNumber) {
        await connectBill(bucketId, newName, billerNetwork, billerAccountNumber, newAmount, newDueDate);
      }

      await loadTransactions();
      resetForm();
      setAddModalOpen(false);
    } catch (error) {
      // API error modal will be shown via context
    } finally {
      setIsSubmitting(false);
    }
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
              resetForm();
              setNewCategory(activeTab);
              setWizardStep(1);
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
                <ProgressCircle
                  progress={goalOverallPct}
                  size={190}
                  strokeWidth={20}
                  color="#C5F347"
                  backgroundColor="#ECEEE4"
                >
                  <View style={styles.donutCenter}>
                    <Text style={styles.donutText}>{goalOverallPct}%</Text>
                    <Text style={styles.donutSubText}>completed</Text>
                  </View>
                </ProgressCircle>
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
                      <ProgressCircle
                        progress={progressPct}
                        size={44}
                        strokeWidth={6}
                        color="#10201B"
                        backgroundColor="#ECEEE4"
                      >
                        <Text style={styles.avatarCircleText}>{letter}</Text>
                      </ProgressCircle>
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

      {/* ADD BUCKET BOTTOM SHEET WIZARD */}
      <Modal
        visible={addModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalOpen(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setAddModalOpen(false)} />
          <View style={styles.modalCard}>
            {/* GRAB HANDLE */}
            <View style={styles.grabHandle} />

            {/* WIZARD HEADER */}
            <View style={styles.wizardHeader}>
              <TouchableOpacity
                style={styles.wizardIconBtn}
                onPress={() => {
                  if (wizardStep > 1) {
                    setWizardStep(wizardStep - 1);
                  } else {
                    setAddModalOpen(false);
                  }
                }}
              >
                <IconSymbol name="chevron.left" size={16} color="#10201B" />
              </TouchableOpacity>
              
              <View style={styles.wizardProgress}>
                <View style={[styles.progressSegment, wizardStep >= 1 && styles.progressSegmentActive]} />
                <View style={[styles.progressSegment, wizardStep >= 2 && styles.progressSegmentActive]} />
                <View style={[styles.progressSegment, wizardStep >= 3 && styles.progressSegmentActive]} />
                <View style={[styles.progressSegment, wizardStep >= 4 && styles.progressSegmentActive]} />
              </View>

              <TouchableOpacity style={styles.wizardIconBtn} onPress={() => setAddModalOpen(false)}>
                <IconSymbol name="xmark" size={16} color="#10201B" />
              </TouchableOpacity>
            </View>

            {wizardStep === 1 && (
              <>
                <Text style={styles.modalTitle}>
                  {newCategory === 'bill' ? 'Name this biller' : `Name this ${newCategory}`}
                </Text>
                <Text style={styles.modalSubtitle}>This is what you'll see on Home and in Buckets.</Text>
                <View style={styles.modalField}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={newCategory === 'saving' ? 'e.g. Groceries' : newCategory === 'bill' ? 'e.g. ComEd' : 'Name'}
                    placeholderTextColor="#9A9A90"
                    value={newName}
                    onChangeText={setNewName}
                    autoFocus
                  />
                </View>
                <View style={{ flex: 1 }} />

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, newName.trim() ? styles.modalButtonConfirm : styles.modalButtonDisabled]}
                    onPress={() => setWizardStep(2)}
                    disabled={!newName.trim()}
                  >
                    <Text style={newName.trim() ? styles.modalButtonConfirmText : styles.modalButtonDisabledText}>
                      Continue
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {wizardStep === 2 && newCategory !== 'bill' && (
              <>
                <Text style={styles.modalTitle}>Amount and Details</Text>
                <Text style={styles.modalSubtitle}>Set the {newCategory === 'goal' ? 'target amount' : 'amount'} and recurrence.</Text>
                
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Amount</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="0.00"
                    placeholderTextColor="#9A9A90"
                    keyboardType="numeric"
                    value={newAmount}
                    onChangeText={setNewAmount}
                    autoFocus
                  />
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>
                    How often should this be funded?
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

                <View style={{ flex: 1 }} />
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, newAmount.trim() ? styles.modalButtonConfirm : styles.modalButtonDisabled]}
                    onPress={() => setWizardStep(3)}
                    disabled={!newAmount.trim()}
                  >
                    <Text style={newAmount.trim() ? styles.modalButtonConfirmText : styles.modalButtonDisabledText}>
                      Continue
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {wizardStep === 2 && newCategory === 'bill' && (
              <>
                <Text style={styles.modalTitle}>Connect Biller</Text>
                <Text style={styles.modalSubtitle}>Select the provider and enter your account number.</Text>
                
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Biller Network</Text>
                  <View style={styles.recurrenceRow}>
                    {availableNetworks.map((net) => (
                      <TouchableOpacity
                        key={net}
                        style={[styles.recurrenceChip, billerNetwork === net && styles.recurrenceChipActive]}
                        onPress={() => setBillerNetwork(net)}
                      >
                        <Text style={[styles.recurrenceChipText, billerNetwork === net && styles.recurrenceChipTextActive]}>
                          {net}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Account Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 123456789"
                    placeholderTextColor="#9A9A90"
                    keyboardType="numeric"
                    value={billerAccountNumber}
                    onChangeText={setBillerAccountNumber}
                  />
                </View>

                <View style={{ flex: 1 }} />
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, (billerNetwork && billerAccountNumber.trim()) ? styles.modalButtonConfirm : styles.modalButtonDisabled]}
                    onPress={async () => {
                      if (!billerNetwork || !billerAccountNumber.trim()) return;
                      setIsSubmitting(true);
                      try {
                        const details = await previewBill(newName, billerNetwork, billerAccountNumber.trim());
                        setBillPreview(details);
                        setNewAmount(details.amountDue);
                        
                        // Parse the date to a simple format like "Oct 14"
                        const d = new Date(details.dueDate);
                        const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        setNewDueDate(formattedDate);
                        
                        setWizardStep(3);
                      } catch (error) {
                        // Error handled by context
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={!billerNetwork || !billerAccountNumber.trim() || isSubmitting}
                  >
                    <Text style={(billerNetwork && billerAccountNumber.trim()) ? styles.modalButtonConfirmText : styles.modalButtonDisabledText}>
                      {isSubmitting ? 'Fetching...' : 'Continue'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <Text style={styles.modalTitle}>Describe this {newCategory}</Text>
                <Text style={styles.modalSubtitle}>What is this {newCategory} for?</Text>
                <View style={styles.modalField}>
                  <TextInput
                    style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
                    placeholder="Optional description"
                    placeholderTextColor="#9A9A90"
                    multiline
                    value={newDescription}
                    onChangeText={setNewDescription}
                    autoFocus
                  />
                </View>

                <View style={{ flex: 1 }} />
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={() => setWizardStep(4)}
                  >
                    <Text style={styles.modalButtonConfirmText}>
                      Continue
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {wizardStep === 4 && (
              <>
                <Text style={styles.modalTitle}>Ready to create</Text>
                <Text style={styles.modalSubtitle}>Review your {newCategory} details.</Text>
                
                <View style={{ backgroundColor: '#ECEEE4', padding: 16, borderRadius: 16, marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, color: '#6F6F68', marginBottom: 4 }}>Name</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#10201B', marginBottom: 12 }}>{newName}</Text>
                  
                  {newDescription.trim() ? (
                    <>
                      <Text style={{ fontSize: 13, color: '#6F6F68', marginBottom: 4 }}>Description</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#10201B', marginBottom: 12 }}>{newDescription.trim()}</Text>
                    </>
                  ) : null}

                  <Text style={{ fontSize: 13, color: '#6F6F68', marginBottom: 4 }}>Amount</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#10201B', marginBottom: 12 }}>${newAmount}</Text>
                  
                  {newCategory !== 'bill' && (
                    <>
                      <Text style={{ fontSize: 13, color: '#6F6F68', marginBottom: 4 }}>Recurrence</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#10201B', marginBottom: 12 }}>
                        {RECURRENCE_OPTIONS.find(r => r.key === newRecurrence)?.label}
                      </Text>
                    </>
                  )}

                  {newCategory === 'bill' && (
                    <>
                      <Text style={{ fontSize: 13, color: '#6F6F68', marginBottom: 4 }}>Biller Network</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#10201B', marginBottom: 12 }}>{billerNetwork}</Text>
                      
                      <Text style={{ fontSize: 13, color: '#6F6F68', marginBottom: 4 }}>Account Number</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#10201B', marginBottom: 12 }}>{billerAccountNumber}</Text>
                      
                      <Text style={{ fontSize: 13, color: '#6F6F68', marginBottom: 4 }}>Due Date</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#10201B' }}>{newDueDate}</Text>
                    </>
                  )}
                </View>

                <View style={{ flex: 1 }} />
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonConfirm, isSubmitting && { opacity: 0.7 }]} 
                    onPress={handleCreateBucket}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.modalButtonConfirmText}>{isSubmitting ? 'Creating...' : 'Create'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    height: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingTop: 12,
    paddingBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  grabHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  wizardIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECEEE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingHorizontal: 20,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#ECEEE4',
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#10201B',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6F6F68',
    marginBottom: 20,
  },
  wizardOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#ECEEE4',
    marginBottom: 10,
    alignItems: 'center',
  },
  wizardOptionActive: {
    backgroundColor: '#10201B',
  },
  wizardOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6F6F68',
  },
  wizardOptionTextActive: {
    color: '#FFFFFF',
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
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#ECEEE4',
    fontSize: 16,
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
    marginTop: 14,
    width: '100%',
  },
  modalButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#ECEEE4',
  },
  modalButtonDisabledText: {
    color: '#9A9A90',
    fontWeight: '700',
    fontSize: 16,
  },
  modalButtonConfirm: {
    backgroundColor: '#10201B',
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});