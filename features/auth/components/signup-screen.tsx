import { useSignUp } from "@clerk/expo/legacy";
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
  const insets = useSafeAreaInsets();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string } | null>(null);

  const handleSignUp = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      setAlertConfig({ title: "Missing info", message: "Please enter both email and password." });
      return;
    }

    setLoading(true);
    try {
      // 1. Create signup attempt
      await signUp.create({
        emailAddress: email,
        password,
        firstName: username.trim() || undefined,
      });

      // 2. Prepare email address verification
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setLoading(false);
      setPendingVerification(true);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "An error occurred during signup.";
      console.error("Signup failed:", errorMessage, err);
      setAlertConfig({ title: "Signup failed", message: errorMessage });
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;

    if (!code) {
      setAlertConfig({ title: "Missing code", message: "Please enter the verification code." });
      return;
    }

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
        console.warn("Uncompleted sign up attempt:", completeSignUp);
        setAlertConfig({ title: "Action required", message: "Please complete outstanding sign-up requirements." });
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.errors?.[0]?.longMessage || err.message || "An error occurred during verification.";
      console.error("Verification failed:", errorMessage, err);
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

      {/* Header matching Login exactly */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoBackCard} />
            <View style={styles.logoFrontCard} />
          </View>
        </View>
        <Text style={styles.title}>Sign up</Text>
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {pendingVerification && (
          <Text style={styles.subtitle}>
            Enter the verification code sent to your email
          </Text>
        )}

        {!pendingVerification ? (
          <View>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Alex Rivera"
              placeholderTextColor="#10201B66"
              autoCapitalize="words"
            />

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

            <Text style={styles.label}>Create password</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                style={[styles.input, { paddingRight: 48, marginBottom: 8 }]}
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

            <Text style={styles.termsText}>
              By signing up, you agree to our Terms & Privacy Policy
            </Text>

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
              onPress={() => router.push("/login")}
              style={{ marginTop: 8, alignItems: "center" }}
              activeOpacity={0.7}
            >
              <Text style={styles.footerText}>
                Already have an account? <Text style={styles.footerTextLink}>Log in</Text>
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
              activeOpacity={0.7}
            >
              <Text style={[styles.footerText, { color: "#2F5D50" }]}>
                Back to sign up
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
