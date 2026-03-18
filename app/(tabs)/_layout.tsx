import { Tabs } from "expo-router";
import { Home, KeyRound, PlusCircle } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0f766e",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 6,
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
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
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
