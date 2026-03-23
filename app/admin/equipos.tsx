import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react-native";

import { useTheme } from "@react-navigation/native";
import { getUserData, allowAccess } from "@/backend/auth-functions";
import { ROLES } from "@/constants/roles";


export default function EquiposScreen() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Verifica que puedas acceder a esta pantalla con tu rol
  useEffect(() => {
    const getAccessPermission = async () => {
      const user = await getUserData();
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const canAccess = await allowAccess(user.id, ROLES.admin);
      if (!canAccess) {
        router.replace("/error/no-admin");
        return;
      }
      setLoading(false);
    };
    getAccessPermission();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingLabel}>Cargando…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={28} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Equipos</Text>
      <Text style={styles.desc}>Administra todos los equipos desde esta pantalla.</Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingLabel: {
    fontSize: 15,
    color: colors.text,
    opacity: 0.7,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 32,
    left: 18,
    zIndex: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: colors.text,
    marginTop: 12,
  },
  desc: {
    fontSize: 16,
    color: colors.accent,
    textAlign: "center",
  },
});
