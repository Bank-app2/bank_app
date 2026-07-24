import { useSignIn } from "@clerk/expo/legacy";
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
  const { signIn, setActive, isLoaded } = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMfa, setPendingMfa] = useState(false);

  const handleLogin = async () => {
    if (!isLoaded) return;
    
    if (!email || !password) {
      Alert.alert("Missing info", "Enter both your email and password.");
      return;
    }

    setLoading(true);
    try {
      // Initiate sign-in attempt via Clerk SDK
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else if (signInAttempt.status === "needs_client_trust") {
        // Send MFA/second-factor verification code
        await signIn.prepareSecondFactor({ strategy: "email_code" });
        setLoading(false);
        setPendingMfa(true);
      } else {
        console.warn("Uncompleted sign in attempt:", signInAttempt);
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

  const handleMfaVerify = async () => {
    if (!isLoaded) return;

    if (!code) {
      Alert.alert("Missing code", "Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      const completeSignIn = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });

      if (completeSignIn.status === "complete") {
        await setActive({ session: completeSignIn.createdSessionId });
      } else {
        console.warn("Uncompleted MFA sign in attempt:", completeSignIn);
        Alert.alert("Action required", "Please complete authentication.");
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "An error occurred during verification.";
      console.error("MFA verification failed:", errorMessage, err);
      Alert.alert("Verification failed", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>
        {pendingMfa
          ? "Enter the verification code sent to your email"
          : "Log in to your account"}
      </Text>

      {!pendingMfa ? (
        <View>
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
        </View>
      ) : (
        <View>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleMfaVerify}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Verifying..." : "Verify & Log in"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPendingMfa(false)}
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <Text style={{ color: "#2F5D50", fontSize: 14, fontWeight: "500" }}>
              Back to log in
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
