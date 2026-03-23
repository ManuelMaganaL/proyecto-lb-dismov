import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react-native";

import { useTheme } from "@react-navigation/native";
import { getUserData, allowAccess } from "@/backend/auth-functions";
import { fetchEquipos, Equipo } from "@/backend/equipos-functions";
import { ROLES } from "@/constants/roles";


export default function EquiposScreen() {
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
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
      const { data, error } = await fetchEquipos();
      if (error) {
        setFetchError(error);
      } else {
        setEquipos(data);
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
      <Text style={styles.desc}>Listado de equipos registrados en la organizacion.</Text>

      {fetchError ? (
        <Text style={styles.errorText}>No se pudo cargar el listado: {fetchError}</Text>
      ) : equipos.length === 0 ? (
        <Text style={styles.emptyText}>No hay equipos registrados.</Text>
      ) : (
        <FlatList
          data={equipos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nombre}</Text>
            </View>
          )}
        />
      )}
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
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingVertical: 32,
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
    marginBottom: 8,
    color: colors.text,
    marginTop: 40,
    textAlign: "center",
  },
  desc: {
    fontSize: 16,
    color: colors.accent,
    textAlign: "center",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  cardLine: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.9,
    marginBottom: 2,
  },
  emptyText: {
    marginTop: 24,
    textAlign: "center",
    color: colors.text,
    opacity: 0.7,
  },
  errorText: {
    marginTop: 24,
    textAlign: "center",
    color: colors.danger,
  },
});
