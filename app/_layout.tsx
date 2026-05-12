import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/backend/supabase/client";
import { getUserData } from "@/backend/auth-functions";
import { ThemeProvider, useTheme } from "@/context/theme";

function RootContent() {
  const router = useRouter();
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const { colors } = useTheme();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const isAuthRoute = useMemo(() => segments[0] === "auth", [segments]);
  const isAtRoot = useMemo(() => (segments as unknown as string[]).length === 0, [segments]);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const user = await getUserData();

      if (!isMounted) return;

      const segs = segmentsRef.current as unknown as string[];
      const atRoot = segs.length === 0;
      const onAuth = segs[0] === "auth";

      if (!user && !onAuth) {
        router.replace("/auth/login");
      } else if (user && (onAuth || atRoot)) {
        router.replace("/auth/usuarios-link");
      }

      setIsCheckingSession(false);
    }

    validateSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const segs = segmentsRef.current as unknown as string[];
      const atRoot = segs.length === 0;
      const onAuth = segs[0] === "auth";

      if (!session?.user) {
        router.replace("/auth/login");
        return;
      }

      if (onAuth || atRoot) {
        router.replace("/auth/usuarios-link");
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [isAuthRoute, isAtRoot, router]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
        {isCheckingSession ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <Stack screenOptions={{ headerShown: false }} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootContent />
    </ThemeProvider>
  );
}
