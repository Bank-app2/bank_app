import { useSignIn } from "@clerk/expo/legacy";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { styles } from "@/features/auth/styles/login.styles";
import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CustomAlert } from "@/components/custom-alert";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, setActive, isLoaded } = useSignIn();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMfa, setPendingMfa] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string } | null>(null);

  const handleLogin = async () => {
    if (!isLoaded) return;
    
    if (!email || !password) {
      setAlertConfig({ title: "Missing info", message: "Enter both your email and password." });
      return;
    }

    setLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else if (signInAttempt.status === "needs_client_trust") {
        await signIn.prepareSecondFactor({ strategy: "email_code" });
        setLoading(false);
        setPendingMfa(true);
      } else {
        console.warn("Uncompleted sign in attempt:", signInAttempt);
        setAlertConfig({ title: "Action required", message: "Please complete authentication." });
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "An error occurred during login.";
      console.error("Login caught exception:", errorMessage, err);
      setAlertConfig({ title: "Login failed", message: errorMessage });
    }
  };

  const handleMfaVerify = async () => {
    if (!isLoaded) return;

    if (!code) {
      setAlertConfig({ title: "Missing code", message: "Please enter the verification code." });
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
        setAlertConfig({ title: "Action required", message: "Please complete authentication." });
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "An error occurred during verification.";
      console.error("MFA verification failed:", errorMessage, err);
      setAlertConfig({ title: "Verification failed", message: errorMessage });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      {/* Lime Circle top banner */}
      <View style={styles.circleHeader} />

      {/* Header with SVG Logo replacement */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoBackCard} />
            <View style={styles.logoFrontCard} />
          </View>
        </View>
        <Text style={styles.title}>Log in</Text>
      </View>

      <ScrollView 
        style={styles.formScroll} 
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {pendingMfa && (
          <Text style={styles.subtitle}>
            Enter the verification code sent to your email
          </Text>
        )}

        {!pendingMfa ? (
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#10201B66"
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
                placeholderTextColor="#10201B66"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 0,
                  top: 8,
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

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <Ionicons name="logo-google" size={20} color="#10201B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <Ionicons name="logo-apple" size={20} color="#10201B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/signup")}
              style={{ marginTop: 8, alignItems: "center" }}
              activeOpacity={0.7}
            >
              <Text style={styles.footerText}>
                New here? <Text style={styles.footerTextLink}>Create an account</Text>
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
              activeOpacity={0.7}
            >
              <Text style={[styles.footerText, { color: "#2F5D50" }]}>
                Back to log in
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CustomAlert
        visible={alertConfig !== null}
        title={alertConfig?.title || ""}
        message={alertConfig?.message || ""}
        onClose={() => setAlertConfig(null)}
      />
    </KeyboardAvoidingView>
  );
}
