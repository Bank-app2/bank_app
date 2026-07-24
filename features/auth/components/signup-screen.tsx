import { useSignUp } from "@clerk/expo/legacy";
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

interface StrengthDetails {
  score: number;
  label: string;
  color: string;
}

const getPasswordStrength = (pass: string): StrengthDetails => {
  const checks = {
    length: pass.length >= 8,
    lowercase: /[a-z]/.test(pass),
    uppercase: /[A-Z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
  };

  if (!pass) {
    return { score: 0, label: "Empty", color: "#DAD5C6" };
  }

  if (!checks.length) {
    return { score: 1, label: "Too Short", color: "#E53E3E" };
  }

  const metCount = [checks.lowercase, checks.uppercase, checks.number, checks.special].filter(Boolean).length;

  let score = 1;
  let label = "Weak";
  let color = "#E53E3E";

  if (metCount === 2) {
    score = 2;
    label = "Fair";
    color = "#DD6B20";
  } else if (metCount === 3) {
    score = 3;
    label = "Good";
    color = "#D69E2E";
  } else if (metCount === 4) {
    score = 4;
    label = "Strong";
    color = "#2F5D50";
  }

  return { score, label, color };
};

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create signup attempt
      await signUp.create({
        emailAddress: email,
        password,
      });

      // 2. Prepare email address verification (sends code)
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setLoading(false);
      setPendingVerification(true);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "An error occurred during signup.";
      console.error("Signup failed:", errorMessage, err);
      Alert.alert("Signup failed", errorMessage);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;

    if (!code) {
      Alert.alert("Missing code", "Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      // 3. Attempt email address verification (verifies code)
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      // 4. Finalize the signup (setActive)
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
        console.warn("Uncompleted sign up attempt:", completeSignUp);
        Alert.alert("Action required", "Please complete outstanding sign-up requirements.");
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "An error occurred during verification.";
      console.error("Verification failed:", errorMessage, err);
      Alert.alert("Verification failed", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        {pendingVerification
          ? "Enter the verification code sent to your email"
          : "Get started with your new account"}
      </Text>

      {!pendingVerification ? (
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
              style={[styles.input, { paddingRight: 48, marginBottom: 8 }]}
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

          {password.length > 0 && (
            <View style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: "#10201B99" }}>Password strength:</Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: getPasswordStrength(password).color }}>
                  {getPasswordStrength(password).label}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 4, height: 4 }}>
                {[1, 2, 3, 4].map((index) => (
                  <View
                    key={index}
                    style={{
                      flex: 1,
                      height: "100%",
                      borderRadius: 2,
                      backgroundColor: getPasswordStrength(password).score >= index ? getPasswordStrength(password).color : "#DAD5C6",
                    }}
                  />
                ))}
              </View>
              <Text style={{ fontSize: 11, color: "#10201B66", marginTop: 6 }}>
                Use 8+ characters with uppercase, lowercase, numbers & symbols.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Signing up..." : "Sign up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <Text style={{ color: "#2F5D50", fontSize: 14, fontWeight: "500" }}>
              Already have an account? Log in
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
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Verifying..." : "Verify & Sign in"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPendingVerification(false)}
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <Text style={{ color: "#2F5D50", fontSize: 14, fontWeight: "500" }}>
              Back to sign up
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
