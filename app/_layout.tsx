import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";

import { supabase } from "@/backend/supabase/client";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const isAuthRoute = useMemo(() => segments[0] === "auth", [segments]);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!user && !isAuthRoute) {
        router.replace("/auth/login");
      } else if (user && isAuthRoute) {
        router.replace("/(tabs)");
      }

      setIsCheckingSession(false);
    }

    validateSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/auth/login");
        return;
      }

      if (isAuthRoute) {
        router.replace("/(tabs)");
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [isAuthRoute, router]);

  if (isCheckingSession) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
    </Stack>
  );
}
