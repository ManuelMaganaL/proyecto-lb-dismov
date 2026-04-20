import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Modal, TextInput, Alert, Platform, KeyboardAvoidingView } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Users, X } from "lucide-react-native";

import { useTheme } from "@/context/theme";
import { getUserData, allowAccess } from "@/backend/auth-functions";
import { fetchEquipos, Equipo } from "@/backend/equipos-functions";
import { fetch_crearequipos } from "@/backend/equiposcrear-functions";
import { ROLES } from "@/constants/roles";


export default function EquiposScreen() {
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nombre, setNombre] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
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

  const reloadEquipos = async () => {
    const { data, error } = await fetchEquipos();
    if (error) {
      setFetchError(error);
    } else {
      setEquipos(data);
      setFetchError(null);
    }
  };

  const handleOpenCreate = () => {
    setCreateError(null);
    setNombre("");
    setLeaderId("");
    setShowCreateModal(true);
  };

  const handleCreateEquipo = async () => {
    const nombreTrim = nombre.trim();
    const leaderTrim = leaderId.trim();

    if (!nombreTrim) {
      setCreateError("El nombre es obligatorio.");
      return;
    }
    if (!leaderTrim) {
      setCreateError("El leader_id es obligatorio.");
      return;
    }

    setCreating(true);
    setCreateError(null);

    const result = await fetch_crearequipos(nombreTrim, leaderTrim);
    if (!result.success) {
      setCreating(false);
      setCreateError(result.error || "Error al crear el equipo.");
      Alert.alert("Error", result.error || "Error al crear el equipo.");
      return;
    }

    setCreating(false);
    setShowCreateModal(false);
    setNombre("");
    setLeaderId("");

    await reloadEquipos();
  };

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {fetchError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar el listado: {fetchError}</Text>
        </View>
      ) : (
        <FlatList
          data={equipos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.infoSection}>
              <Text style={styles.title}>Equipos</Text>
              <Text style={styles.desc}>Listado de equipos registrados en la organización.</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={64} color={colors.accent} />
              <Text style={styles.emptyText}>No hay equipos registrados.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.replace(`/admin/equipos/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Users size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.nombre}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity style={styles.fabButton} onPress={handleOpenCreate}>
          <Text style={styles.fabText}>Crear equipo</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCreateModal} animationType="slide" transparent={true} onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalKeyboard}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Crear equipo</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {createError ? <Text style={styles.modalErrorText}>{createError}</Text> : null}

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del equipo"
                placeholderTextColor={colors.accent}
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Líder ID</Text>
              <TextInput
                style={styles.input}
                placeholder="UUID del leader"
                placeholderTextColor={colors.accent}
                value={leaderId}
                onChangeText={setLeaderId}
                autoCapitalize="none"
              />

              <TouchableOpacity style={[styles.submitButton, creating && styles.submitButtonDisabled]} onPress={handleCreateEquipo} disabled={creating}>
                {creating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Crear</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  backButton: {
    padding: 8,
    alignSelf: "flex-start",
    marginLeft: -8,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 6,
  },
  desc: {
    fontSize: 16,
    color: colors.accent,
    lineHeight: 22,
  },
  infoSection: {
    marginBottom: 24,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 16,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    maxWidth: "80%",
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    color: colors.danger,
  },
  fabWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    zIndex: 20,
  },
  fabButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  fabText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalKeyboard: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 20,
    marginTop: 180,
    borderWidth: 1,
    borderColor: colors.accent,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.foreground,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  modalErrorText: {
    marginBottom: 12,
    color: colors.danger,
    textAlign: "center",
  },
  submitButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
});
