import React, { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  Modal,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  Crown,
  Search,
  X
} from "lucide-react-native";

import { useTheme } from "@/context/theme";
import { getUserData, allowAccess } from "@/backend/auth-functions";
import {
  fetchEquipoById,
  fetchMiembrosEquipo,
  fetchUsuariosOrganizacionConEquipos,
  addMiembroEquipo,
  removeMiembroEquipo,
  Equipo,
  MiembroEquipo,
  UsuarioConEquipos
} from "@/backend/equipos-functions";
import { ROLES } from "@/constants/roles";

export default function SingleTeamTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [miembros, setMiembros] = useState<MiembroEquipo[]>([]);

  // Estados del Modal de búsqueda
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UsuarioConEquipos[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Obtenemos el ID del equipo desde la ruta
  let { id } = useLocalSearchParams();
  const equipoId = typeof id === "string" ? id : (id ? id[0] : null);

  const loadData = useCallback(async () => {
    if (!equipoId) return;

    // Verificar usuario y rol
    const userData = await getUserData();
    if (!userData) {
      router.replace("/auth/login");
      return;
    }
    setUser(userData);

    // Solo los administradores (rol 1) pueden acceder a esta vista
    const canAccess = await allowAccess(userData.id, ROLES.admin);
    if (!canAccess) {
      router.replace("/error/no-admin");
      return;
    }

    // Cargar datos del equipo
    const { data: equipoData, error: equipoError } = await fetchEquipoById(equipoId);
    if (equipoError || !equipoData) {
      Alert.alert("Error", "No se pudo cargar la información del equipo.");
      setLoading(false);
      return;
    }
    setEquipo(equipoData);

    // Cargar miembros del equipo
    const { data: miembrosData, error: miembrosError } = await fetchMiembrosEquipo(equipoId);
    if (miembrosError) {
      Alert.alert("Error", "No se pudieron cargar los miembros del equipo.");
    } else {
      setMiembros(miembrosData);
    }

    setLoading(false);
  }, [equipoId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!equipo) return;

    if (memberId === equipo.leader_id) {
      Alert.alert("Acción no permitida", "No puedes eliminar al líder del equipo. Cambia el líder primero.");
      return;
    }

    Alert.alert(
      "Eliminar miembro",
      `¿Seguro que deseas eliminar a ${memberName} de este equipo?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { success, error } = await removeMiembroEquipo(equipo.id, memberId);
            if (success) {
              setMiembros(prev => prev.filter(m => m.id !== memberId));
            } else {
              Alert.alert("Error", error || "No se pudo eliminar al miembro.");
            }
          }
        }
      ]
    );
  };

  const openSearchModal = async () => {
    if (!equipo || !equipo.organizacion_id) return;

    setShowSearchModal(true);
    setSearchQuery("");
    setLoadingSearch(true);

    const { data, error } = await fetchUsuariosOrganizacionConEquipos(equipo.organizacion_id, equipo.id);
    if (!error) {
      setAvailableUsers(data);
    }
    setLoadingSearch(false);
  };

  const handleAddMember = async (usuarioId: string) => {
    if (!equipo) return;

    const { success, error } = await addMiembroEquipo(equipo.id, usuarioId);
    if (success) {
      // Recargar la lista principal de miembros
      const { data } = await fetchMiembrosEquipo(equipo.id);
      setMiembros(data);
      setShowSearchModal(false);
    } else {
      Alert.alert("Error", error || "No se pudo añadir al miembro.");
    }
  };

  const filteredUsers = availableUsers.filter(u =>
    u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.correo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingLabel}>Cargando información del equipo…</Text>
      </View>
    );
  }

  if (!equipo) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.loadingLabel}>Equipo no encontrado.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Volver</Text>
        </TouchableOpacity>
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

      <FlatList
        data={miembros}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.infoSection}>
            <Text style={styles.title}>{equipo.nombre}</Text>
            <Text style={styles.desc}>Gestiona los miembros de este equipo.</Text>
            <View style={styles.divider} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={64} color={colors.accent} />
            <Text style={styles.emptyText}>Este equipo no tiene miembros aún.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View>
            <View style={styles.memberItem}>
              <View style={styles.avatar}>
                {item.foto_url ? (
                  <Image source={{ uri: item.foto_url }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {item.nombre.substring(0, 2).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.memberName}>{item.nombre}</Text>
                  {item.id === equipo.leader_id && (
                    <View style={[styles.leaderBadge, { backgroundColor: colors.primary }]}>
                      <Crown size={12} color="#FFF" />
                      <Text style={styles.leaderText}>Líder</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberEmail}>{item.correo}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveMember(item.id, item.nombre)}
              >
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
            {(index < miembros.length - 1) && (
              <View style={styles.memberDivider} />
            )}
          </View>
        )}
        ListFooterComponent={
          <>
            <View style={[styles.memberDivider, { marginTop: 16 }]} />
            <TouchableOpacity
              style={styles.addButtonFull}
              onPress={openSearchModal}
            >
              <UserPlus size={18} color="#FFF" />
              <Text style={styles.addButtonFullText}>Añadir miembro</Text>
            </TouchableOpacity>
          </>
        }
      />

      {/* Modal para añadir miembros */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir a la organización</Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Search size={20} color={colors.accent} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o correo..."
                placeholderTextColor={colors.accent}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loadingSearch ? (
              <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />
            ) : (
              <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
                {filteredUsers.length === 0 ? (
                  <Text style={styles.noResults}>No se encontraron usuarios disponibles.</Text>
                ) : (
                  filteredUsers.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={styles.userResult}
                      onPress={() => handleAddMember(u.id)}
                    >
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarInitialSmall}>
                          {u.nombre.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{u.nombre}</Text>
                        <Text style={styles.resultEmail}>{u.correo}</Text>

                        {/* Badges de otros equipos */}
                        {u.equipos && u.equipos.length > 0 && (
                          <View style={styles.badgeContainer}>
                            {u.equipos.map((equipoNombre, idx) => (
                              <View key={idx} style={styles.teamBadge}>
                                <Text style={styles.teamBadgeText}>{equipoNombre}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      <UserPlus size={20} color={colors.primary} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoSection: {
    marginBottom: 24,
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
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.2,
    marginBottom: 8,
  },
  memberDivider: {
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.15,
    marginVertical: 4,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#FFF',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.accent,
  },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  leaderText: {
    fontSize: 10,
    fontWeight: "800",
    color: '#FFF',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  addButtonFullText: {
    fontSize: 16,
    fontWeight: "600",
    color: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 16,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    maxWidth: '80%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.foreground,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text,
  },
  resultsList: {
    flex: 1,
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.foreground,
    borderWidth: 1,
    borderColor: colors.accent + '20',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitialSmall: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#FFF',
  },
  resultInfo: {
    flex: 1,
    paddingRight: 10,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  resultEmail: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  teamBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  teamBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.accent,
    fontSize: 16,
  },
});
