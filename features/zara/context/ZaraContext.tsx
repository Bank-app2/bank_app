import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer'; // Need to polyfill or just play from URI

export interface ZaraMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ZaraSession {
  id: string;
  createdAt: string;
}

interface ZaraContextValue {
  sessions: ZaraSession[];
  currentSessionId: string | null;
  messages: ZaraMessage[];
  isLoading: boolean;
  isRecording: boolean;
  loadSessions: () => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecordingAndSend: () => Promise<void>;
}

const ZaraContext = createContext<ZaraContextValue | null>(null);

export const ZaraProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<ZaraSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ZaraMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const apiCall = useApi();

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiCall('/api/zara/sessions');
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const loadMessages = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      setCurrentSessionId(sessionId);
      const data = await apiCall(`/api/zara/sessions/${sessionId}/messages`);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  const playAudio = async (text: string) => {
    try {
      // Fetch audio buffer from synthesize endpoint
      const response = await apiCall('/api/zara/synthesize', {
        method: 'POST',
        body: JSON.stringify({ text }),
        // Ideally we'd receive arraybuffer or blob, but useApi parses JSON by default.
        // For this demo, let's assume we can modify useApi or fetch directly.
      }); // We'll need a way to fetch raw data
      
      // Temporary basic fetch for audio since useApi parses JSON
      // We will skip raw audio playback in this simple mock and just use expo-speech if possible, 
      // or we can fetch as blob and play.
      // Let's use expo-av directly with the API URL if we can pass auth headers, but we can't easily.
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    // Optimistic UI
    const tempId = Math.random().toString();
    setMessages(prev => [...prev, { id: tempId, role: 'user', content, createdAt: new Date().toISOString() }]);
    setIsLoading(true);
    try {
      const response = await apiCall('/api/zara/chat', {
        method: 'POST',
        body: JSON.stringify({ sessionId: currentSessionId, message: content })
      });
      if (response.sessionId !== currentSessionId) {
        setCurrentSessionId(response.sessionId);
      }
      // Add response
      setMessages(prev => [...prev, { id: Math.random().toString(), role: 'assistant', content: response.reply, createdAt: new Date().toISOString() }]);
      
      // Play audio
      // playAudio(response.reply);

    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, currentSessionId]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecordingAndSend = async () => {
    setIsRecording(false);
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;
      
      setIsLoading(true);
      
      const fileExt = uri.split('.').pop() || 'm4a';
      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: `recording.${fileExt}`,
        type: `audio/m4a`, // iOS typically gives m4a
      } as any);
      
      const response = await apiCall('/api/zara/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (response.text) {
        await sendMessage(response.text);
      }
    } catch (error) {
      console.error('Failed to stop recording or transcribe', error);
      setIsLoading(false);
    } finally {
      setRecording(null);
    }
  };

  return (
    <ZaraContext.Provider value={{
      sessions,
      currentSessionId,
      messages,
      isLoading,
      isRecording,
      loadSessions,
      loadMessages,
      sendMessage,
      startRecording,
      stopRecordingAndSend
    }}>
      {children}
    </ZaraContext.Provider>
  );
};

export const useZara = () => {
  const context = useContext(ZaraContext);
  if (!context) {
    throw new Error('useZara must be used within a ZaraProvider');
  }
  return context;
};
