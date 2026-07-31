import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppProviders } from "@/context/AppProviders";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable.");
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const segmentArray = segments as string[];
    const isRoot = segmentArray.length === 0 || !segmentArray[0];
    const isAuthPath = segmentArray[0] === "login" || segmentArray[0] === "signup";

    if (isSignedIn) {
      if (isAuthPath || isRoot) {
        // Redirect signed-in users away from login/signup/root to tabs
        router.replace("/(tabs)");
      }
    } else {
      if (!isAuthPath) {
        // Redirect unauthenticated users back to login
        router.replace("/login");
      }
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="topup" options={{ presentation: "modal" }} />
      <Stack.Screen name="receive" options={{ presentation: "modal" }} />
      <Stack.Screen name="send" options={{ presentation: "modal" }} />
      <Stack.Screen name="payments" options={{ presentation: "modal" }} />
      <Stack.Screen name="bucket-detail" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AppProviders>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <InitialLayout />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppProviders>
    </ClerkProvider>
  );
}

