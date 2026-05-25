import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { KidProvider, useKid } from "@/contexts/KidContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

function NavGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { activeKid, isLoading: kidLoading } = useKid();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authLoading || kidLoading) return;

    const firstSegment = segments[0] as string;
    const inAuthFlow = firstSegment === 'login' || firstSegment === 'signup';
    const inOnboarding = firstSegment === 'onboarding';

    if (!user) {
      if (!inAuthFlow) router.replace('/login' as any);
      return;
    }

    if (!activeKid) {
      if (!inOnboarding) router.replace('/onboarding' as any);
      return;
    }

    if (inAuthFlow || inOnboarding) {
      router.replace('/(tabs)' as any);
    }
  }, [user, activeKid, authLoading, kidLoading, segments]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <NavGate>
      <Stack screenOptions={{ headerBackTitle: "חזור" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NavGate>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <KidProvider>
          <RootLayoutNav />
        </KidProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
