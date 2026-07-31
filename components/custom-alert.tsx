import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function CustomAlert({ visible, title, message, onClose }: CustomAlertProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 32, 27, 0.4)', // semi-transparent dark green overlay matching branding
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '80%',
    backgroundColor: '#F3F4EE', // warm beige background
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DAD5C6', // beige border
    padding: 24,
    shadowColor: '#10201B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10201B', // forest green
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#10201B99', // subtle gray-green description
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2F5D50', // dark green button
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#F3F4EE',
    fontSize: 15,
    fontWeight: '600',
  },
});
