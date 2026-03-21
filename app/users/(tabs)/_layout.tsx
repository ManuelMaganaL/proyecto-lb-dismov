import { Tabs } from "expo-router";
import { CircleUserRound, KeyRound, PlusCircle, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/theme";

export default function TabsLayout() {
  const { colors } = useTheme();

  const insets = useSafeAreaInsets();

  return (
    <Tabs
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
        name="historial"
        options={{
          title: "Historal",
          tabBarIcon: ({ color, size }) => <KeyRound size={size} color={color} />,
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
        name="administracion-link"
        options={{
          title: "Administrar",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
