import { Tabs } from "expo-router";
import { CircleUserRound, KeyRound, PlusCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0f766e",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          height: 58 + Math.max(insets.bottom, 6),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          backgroundColor: "#f8fafc",
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
        name="ingresar-dato"
        options={{
          title: "Ingresar",
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mis-claves"
        options={{
          title: "Mis Claves",
          tabBarIcon: ({ color, size }) => <KeyRound size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
