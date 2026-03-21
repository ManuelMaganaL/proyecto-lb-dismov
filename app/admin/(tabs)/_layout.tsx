import { Tabs, useRouter } from "expo-router";
import { House, Users, UserCog, Building2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/theme";

export default function TabsLayout() {
  const router = useRouter();
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
        name="usuarios-link"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace("/users/(tabs)");
          },
        }}
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Mis equipos",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="equipos"
        options={{
          title: "Equipos",
          tabBarIcon: ({ color, size }) => <UserCog size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="organizacion"
        options={{
          title: "Organización",
          tabBarIcon: ({ color, size }) => <Building2 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
