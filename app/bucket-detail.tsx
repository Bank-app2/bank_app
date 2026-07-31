import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBuckets } from '@/features/buckets/context/BucketsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BucketDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { buckets, deleteBucket, addToGoal, updateBucketDescription, transferFromBucket, getBucketTransactions } = useBuckets();
  const insets = useSafeAreaInsets();

  const bucketId = parseInt(id as string, 10);
  const selectedDetailBucket = buckets.find(b => b.id === bucketId);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState('');
  
  const [isTransferringOut, setIsTransferringOut] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (selectedDetailBucket) {
      setDescText(selectedDetailBucket.description || '');
      getBucketTransactions(selectedDetailBucket.id).then(setTransactions);
    }
  }, [selectedDetailBucket?.id]);

  if (!selectedDetailBucket) {
    return (
      <View style={styles.container}>
        <Text style={styles.detailTitle}>Bucket not found</Text>
        <TouchableOpacity style={styles.closeDetailButton} onPress={() => router.back()}>
          <Text style={styles.closeDetailButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatMoney = (n: number) => {
    return '$' + Number(n).toFixed(2);
  };

  const handleSaveDesc = async () => {
    await updateBucketDescription(selectedDetailBucket.id, descText);
    setIsEditingDesc(false);
  };

  const handleTransferOut = async () => {
    const amt = parseFloat(transferAmount);
    if (!isNaN(amt) && amt > 0) {
      await transferFromBucket(selectedDetailBucket.id, amt);
      setIsTransferringOut(false);
      setTransferAmount('');
      getBucketTransactions(selectedDetailBucket.id).then(setTransactions);
    }
  };

  const handleAddFunds = async (amt: number) => {
    await addToGoal(selectedDetailBucket.id, amt);
    getBucketTransactions(selectedDetailBucket.id).then(setTransactions);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
      <Text style={styles.detailTitle}>{selectedDetailBucket.name}</Text>
      <Text style={styles.detailCategory}>
        Category: {selectedDetailBucket.category.toUpperCase()}
        {selectedDetailBucket.recurrence && selectedDetailBucket.recurrence !== 'once'
          ? ` · Repeats ${selectedDetailBucket.recurrence}`
          : ''}
      </Text>

      <View style={styles.detailContentContainer}>
        <Text style={styles.detailAmountLabel}>Target / Amount</Text>
        <Text style={styles.detailAmountValue}>
          {selectedDetailBucket.category === 'goal'
            ? `${formatMoney(selectedDetailBucket.current || 0)} / ${formatMoney(selectedDetailBucket.target || 0)}`
            : formatMoney(selectedDetailBucket.amount || 0)}
        </Text>

        <View style={styles.descHeader}>
          <Text style={styles.detailNoteLabel}>Description</Text>
          {!isEditingDesc && (
            <TouchableOpacity onPress={() => setIsEditingDesc(true)}>
              <Text style={styles.editDescBtn}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isEditingDesc ? (
          <View style={styles.editDescContainer}>
            <TextInput
              style={styles.descInput}
              value={descText}
              onChangeText={setDescText}
              multiline
              autoFocus
            />
            <View style={styles.editDescActions}>
              <TouchableOpacity onPress={() => setIsEditingDesc(false)} style={styles.cancelDescBtn}>
                <Text style={styles.cancelDescBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveDesc} style={styles.saveDescBtn}>
                <Text style={styles.saveDescBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.detailNoteValue}>{selectedDetailBucket.description || 'No description provided.'}</Text>
        )}
      </View>

      <View style={styles.quickAddGoalRow}>
        <Text style={styles.quickAddTitle}>Add Funds:</Text>
        <View style={styles.quickAddChips}>
          {[10, 25, 50].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={styles.quickAddChip}
              onPress={() => handleAddFunds(amt)}
            >
              <Text style={styles.quickAddChipText}>+{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.quickAddGoalRow}>
        <View style={styles.descHeader}>
          <Text style={styles.quickAddTitle}>Transfer Out (Release Funds)</Text>
          <TouchableOpacity onPress={() => setIsTransferringOut(!isTransferringOut)}>
            <Text style={styles.editDescBtn}>{isTransferringOut ? 'Cancel' : 'Transfer'}</Text>
          </TouchableOpacity>
        </View>
        {isTransferringOut && (
          <View style={styles.transferOutContainer}>
            <TextInput
              style={styles.transferInput}
              value={transferAmount}
              onChangeText={setTransferAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <TouchableOpacity onPress={handleTransferOut} style={styles.saveDescBtn}>
              <Text style={styles.saveDescBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* TRANSACTION HISTORY */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Transaction History</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyHistory}>No transactions yet.</Text>
        ) : (
          transactions.map(tx => (
            <View key={tx.id} style={styles.historyRow}>
              <View>
                <Text style={styles.txType}>{tx.type === 'fund' ? 'Added Funds' : 'Transferred Out'}</Text>
                <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'fund' ? '#7A9A3F' : '#10201B' }]}>
                {tx.type === 'fund' ? '+' : '-'}{formatMoney(parseFloat(tx.amount))}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* DELETE / CLOSE BUTTONS */}
      <View style={styles.detailActions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            deleteBucket(selectedDetailBucket.id);
            router.back();
          }}
        >
          <Text style={styles.deleteButtonText}>Delete bucket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeDetailButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeDetailButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 32,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 4,
  },
  detailCategory: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A9A3F',
    marginBottom: 24,
  },
  detailContentContainer: {
    marginBottom: 24,
  },
  detailAmountLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F6F68',
    marginBottom: 4,
  },
  detailAmountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 20,
  },
  detailNoteLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F6F68',
    marginBottom: 4,
  },
  detailNoteValue: {
    fontSize: 15,
    color: '#10201B',
    fontWeight: '500',
    lineHeight: 22,
  },
  quickAddGoalRow: {
    backgroundColor: '#ECEEE4',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  quickAddTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10201B',
    marginBottom: 12,
  },
  quickAddChips: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAddChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickAddChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10201B',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#FF4C4C',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FF4C4C',
    fontWeight: '700',
    fontSize: 16,
  },
  closeDetailButton: {
    flex: 1,
    backgroundColor: '#10201B',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDetailButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  descHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  editDescBtn: {
    color: '#7A9A3F',
    fontWeight: '700',
    fontSize: 14,
  },
  editDescContainer: {
    marginTop: 8,
  },
  descInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 12,
  },
  editDescActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelDescBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  cancelDescBtnText: {
    color: '#6F6F68',
    fontWeight: '700',
  },
  saveDescBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#10201B',
  },
  saveDescBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  transferOutContainer: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  transferInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  historyContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 12,
  },
  emptyHistory: {
    color: '#6F6F68',
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  txType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10201B',
  },
  txDate: {
    fontSize: 13,
    color: '#6F6F68',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
