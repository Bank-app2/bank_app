import { useSignIn } from "@clerk/expo";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { styles } from "@/features/auth/styles/login.styles";
import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const isLoaded = signIn !== null;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!isLoaded || !signIn) return;
    
    if (!email || !password) {
      Alert.alert("Missing info", "Enter both your email and password.");
      return;
    }

    setLoading(true);
    try {
      // Initiate sign-in attempt via Clerk SDK
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.error) {
        setLoading(false);
        const errorMessage = result.error.longMessage || result.error.message || "An error occurred during login.";
        console.error("Login failed (ClerkError):", errorMessage, result.error);
        Alert.alert("Login failed", errorMessage);
        return;
      }

      if (signIn.status === "complete") {
        // Finalize sign-in (replaces setActive) and sets the session active
        const finalizeResult = await signIn.finalize();
        if (finalizeResult.error) {
          setLoading(false);
          const errorMessage = finalizeResult.error.longMessage || finalizeResult.error.message || "Failed to finalize session.";
          console.error("Finalize failed (ClerkError):", errorMessage, finalizeResult.error);
          Alert.alert("Login failed", errorMessage);
          return;
        }
        // InitialLayout in _layout.tsx will trigger the redirect automatically.
      } else {
        console.warn("Uncompleted sign in attempt:", signIn);
        Alert.alert("Action required", "Please complete authentication.");
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      // Retrieve the friendly validation error message from Clerk response if available
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "An error occurred during login.";
      console.error("Login caught exception:", errorMessage, err);
      Alert.alert("Login failed", errorMessage);
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
      <View style={{ position: "relative" }}>
        <TextInput
          style={[styles.input, { paddingRight: 48 }]}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#999"
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{
            position: "absolute",
            right: 14,
            top: 12,
            height: 24,
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#10201B99"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Log in"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/signup")}
        style={{ marginTop: 20, alignItems: "center" }}
      >
        <Text style={{ color: "#2F5D50", fontSize: 14, fontWeight: "500" }}>
          Don't have an account? Sign up
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
