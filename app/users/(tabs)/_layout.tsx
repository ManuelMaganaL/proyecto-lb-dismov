import { Tabs } from "expo-router";
import { CircleUserRound, KeyRound, PlusCircle, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/theme";
import { useEffect, useState } from "react";
import { getUserData, allowAccess } from "@/backend/auth-functions";
import { ROLES } from "../../../constants/roles";

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const user = await getUserData();
      if (user) {
        const canAccess = await allowAccess(user.id, ROLES.teamLeader);
        if (canAccess) {
          setShowAdmin(true);
        }
      }
    }
    fetchUser();
  }, []);

  return (
    <Tabs
      initialRouteName="historial"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.accent,
        tabBarStyle: {
          height: 58 + Math.max(insets.bottom, 6),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          borderTopWidth: 1,
          borderTopColor: colors.foreground,
          backgroundColor: colors.background,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <CircleUserRound size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="compartir"
        options={{
          title: "Compartir",
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => <KeyRound size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="administrar"
        options={{
          title: "Administrar",
          href: showAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />

    </Tabs>
  );
}
