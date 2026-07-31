import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useUser, useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { useSettings } from '@/features/settings/context/SettingsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useAuth();

  const {
    notificationsOn,
    faceIdOn,
    toggleNotifications,
    toggleFaceId,
  } = useSettings();

  const name = user?.fullName || 'Your account';
  const email = user?.primaryEmailAddress?.emailAddress || 'you@example.com';
  const avatarUrl = user?.imageUrl || null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top, 20), paddingBottom: 100 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>
      </View>

      <View style={styles.optionsList}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Notifications</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleNotifications}
            style={[
              styles.switchContainer,
              { backgroundColor: notificationsOn ? '#C5F347' : '#DCDED2' }
            ]}
          >
            <View
              style={[
                styles.switchKnob,
                { alignSelf: notificationsOn ? 'flex-end' : 'flex-start' }
              ]}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.optionRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.optionLabel}>Face ID</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleFaceId}
            style={[
              styles.switchContainer,
              { backgroundColor: faceIdOn ? '#C5F347' : '#DCDED2' }
            ]}
          >
            <View
              style={[
                styles.switchKnob,
                { alignSelf: faceIdOn ? 'flex-end' : 'flex-start' }
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => signOut()}
        activeOpacity={0.9}
      >
        <Text style={styles.logoutButtonText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4EE',
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    color: '#F3F4EE',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10201B',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#9A9A90',
    fontWeight: '600',
  },
  optionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEFE8',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10201B',
  },
  switchContainer: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logoutButton: {
    backgroundColor: '#2F5D50',
    borderRadius: 25,
    height: 50,
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
  logoutButtonText: {
    color: '#F3F4EE',
    fontSize: 15,
    fontWeight: '700',
  },
});