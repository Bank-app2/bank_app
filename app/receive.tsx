import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Clipboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReceiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // Local state
  const [copied, setCopied] = useState(false);

  const username = user?.firstName ? user.firstName.toLowerCase() : 'yourname';
  const tag = '@' + username;

  const handleCopy = () => {
    try {
      Clipboard.setString(tag);
    } catch (e) {
      console.log('Clipboard copy failed:', e);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Receive</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* BIG ICON DISPLAY */}
        <View style={styles.qrPlaceholder}>
          <View style={styles.iconContainer}>
            <IconSymbol name="house.fill" size={60} color="#10201B" />
          </View>
          <Text style={styles.qrHelper}>Scan or share this tag to receive money instantly</Text>
        </View>

        {/* HANDLE CONTAINER */}
        <View style={styles.tagCard}>
          <Text style={styles.tagLabel}>Your Zara Tag</Text>
          <Text style={styles.tagValue}>{tag}</Text>
        </View>
      </View>

      {/* COPY BUTTON */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.copyButton, copied && styles.copyButtonActive]}
          onPress={handleCopy}
          activeOpacity={0.9}
        >
          <View style={styles.copyButtonContent}>
            {copied ? null : <IconSymbol name="doc.on.doc.fill" size={16} color="#FFFFFF" />}
            <Text style={styles.copyButtonText}>
              {copied ? 'Copied!' : 'Copy my tag'}
            </Text>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    paddingBottom: 40,
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#C5F347', // Bright Lime Green
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHelper: {
    fontSize: 14,
    color: '#6F6F68',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  tagCard: {
    backgroundColor: '#ECEEE4',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  tagLabel: {
    fontSize: 12,
    color: '#6F6F68',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tagValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10201B',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    width: '100%',
  },
  copyButton: {
    backgroundColor: '#10201B',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  copyButtonActive: {
    backgroundColor: '#2F5D50', // Gray-green active state
  },
  copyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
