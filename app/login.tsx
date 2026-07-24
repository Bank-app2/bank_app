import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { styles } from "../styles/login.styles";

// Change this once your roommate gives you a real backend address.
// On your phone via Expo Go, "localhost" will NOT work — use your
// computer's local network IP instead, e.g. "http://192.168.1.20:3000"
const API_URL = "http://YOUR_BACKEND_ADDRESS_HERE";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter both your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        Alert.alert(
          "Login failed",
          "Check your email and password and try again.",
        );
        setLoading(false);
        return;
      }

      const data = await response.json();
      await AsyncStorage.setItem("authToken", data.token);

      setLoading(false);
      router.replace("/(tabs)");
    } catch {
      setLoading(false);
      Alert.alert(
        "Couldn't connect",
        "Can't reach the server right now. Make sure your backend is running.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to your account</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor="#999"
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Log in"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
