import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from "@/components/ui/button";
import { getUserData, logout } from "@/backend/user-functions";

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const user = await getUserData();
      if (!user) router.push("/auth/login");
    }
    checkUser();
  }, []);

  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      console.log("Error logout:", error);
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <View style={styles.container}>
      <Text>Página principal</Text>
      <StatusBar style="auto" />
      <Button
        title="Cerrar sesión"
        onPress={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
