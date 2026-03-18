import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from "@/components/ui/button";
import { logout } from "@/backend/user-functions";

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      console.log("Error logout:", error);
    } else {
      router.replace("/auth/login");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel Principal</Text>
      <Text style={styles.subtitle}>Gestiona tus claves cifradas de forma segura.</Text>
      <StatusBar style="auto" />
      <Button
        title="Cerrar sesión"
        onPress={handleLogout}
        containerStyle={styles.logoutButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: '#334155',
    fontSize: 15,
  },
  logoutButton: {
    marginTop: 8,
  },
});
