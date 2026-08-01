import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useZara } from '@/features/zara/context/ZaraContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ZaraScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [chatInput, setChatInput] = React.useState('');
  
  const {
    messages,
    isLoading,
    isRecording,
    sendMessage,
    startRecording,
    stopRecordingAndSend,
    loadSessions,
    sessions,
    loadMessages,
  } = useZara();

  useEffect(() => {
    loadSessions().then(() => {
      // For simplicity, if there's no active session, the backend creates one on first message.
      // If you wanted to load the last session:
      // if (sessions.length > 0) loadMessages(sessions[0].id);
    });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecordingAndSend();
    } else {
      startRecording();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Zara</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.bubbleWrapper,
                isUser ? styles.userWrapper : styles.zaraWrapper,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.userBubble : styles.zaraBubble,
                ]}
              >
                <Text style={[styles.bubbleText, isUser ? styles.userText : styles.zaraText]}>
                  {msg.content}
                </Text>
              </View>
            </View>
          );
        })}
        {isLoading && (
          <View style={[styles.bubbleWrapper, styles.zaraWrapper]}>
            <View style={[styles.bubble, styles.zaraBubble]}>
              <Text style={[styles.bubbleText, styles.zaraText]}>...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* INPUT CONTAINER
          FIX: the tab bar in app/(tabs)/_layout.tsx is position: 'absolute'
          and floats over screen content (height 90 on iOS / 70 on Android).
          Home, Buckets, and Settings already add paddingBottom: 100 to clear
          it — this screen didn't, so the input row was rendering underneath
          the tab bar and was never visible. This adds that same clearance. */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom:
              Math.max(insets.bottom, 12) + 12 + (Platform.OS === 'ios' ? 90 : 70),
          },
        ]}
      >
        <TouchableOpacity 
          style={[styles.micButton, isRecording && { backgroundColor: '#FF4B4B' }]} 
          activeOpacity={0.8}
          onPress={toggleRecording}
        >
          <IconSymbol name="mic.fill" size={16} color={isRecording ? "#FFFFFF" : "#10201B"} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Or type to Zara…"
          placeholderTextColor="#9A9A90"
          value={chatInput}
          onChangeText={setChatInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4EE',
  },
  headerContainer: {
    backgroundColor: '#F3F4EE',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10201B',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  zaraWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  userBubble: {
    backgroundColor: '#10201B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  zaraBubble: {
    backgroundColor: '#ECEEE4',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
  },
  userText: {
    color: '#FFFFFF',
  },
  zaraText: {
    color: '#10201B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F3F4EE',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C5F347',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#ECEEE4',
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 40,
    fontSize: 14,
    color: '#10201B',
  },
  sendButton: {
    backgroundColor: '#10201B',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});