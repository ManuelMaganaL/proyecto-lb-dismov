import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Image,
  Modal,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Crown,
  Search,
  X
} from "lucide-react-native";

import { useTheme } from "@/context/theme";
import { ThemeColors } from "@/constants/colors";
import { getUserData, allowAccess } from "@/backend/auth-functions";
import {
  fetchMisEquipos,
  fetchMiembrosEquipo,
  fetchUsuariosOrganizacion,
  addMiembroEquipo,
  removeMiembroEquipo,
  Equipo,
  MiembroEquipo
} from "@/backend/equipos-functions";
import { ROLES } from "@/constants/roles";

export default function MisEquiposScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<Record<string, MiembroEquipo[]>>({});
  const [loadingMiembros, setLoadingMiembros] = useState<Record<string, boolean>>({});

  // Modal de búsqueda
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<MiembroEquipo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);

  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const loadTeams = useCallback(async () => {
    const userData = await getUserData();
    if (!userData) {
      router.replace("/auth/login");
      return;
    }
    setUser(userData);

    const canAccess = await allowAccess(userData.id, ROLES.teamLeader);
    if (!canAccess) {
      router.replace("/error/no-admin");
      return;
    }

    const { data, error } = await fetchMisEquipos(userData.id);
    if (error) {
      Alert.alert("Error", "No se pudieron cargar tus equipos.");
    } else {
      setEquipos(data);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const toggleExpand = async (equipoId: string) => {
    if (expandedId === equipoId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(equipoId);

    if (!miembros[equipoId]) {
      setLoadingMiembros(prev => ({ ...prev, [equipoId]: true }));
      const { data, error } = await fetchMiembrosEquipo(equipoId);
      if (error) {
        Alert.alert("Error", "No se pudieron cargar los miembros del equipo.");
      } else {
        setMiembros(prev => ({ ...prev, [equipoId]: data }));
      }
      setLoadingMiembros(prev => ({ ...prev, [equipoId]: false }));
    }
  };

  const handleRemoveMember = (equipoId: string, memberId: string, memberName: string) => {
    if (memberId === user?.id) {
      Alert.alert("Acción no permitida", "No puedes eliminarte a ti mismo del equipo.");
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
            const { success, error } = await removeMiembroEquipo(equipoId, memberId);
            if (success) {
              setMiembros(prev => ({
                ...prev,
                [equipoId]: prev[equipoId].filter(m => m.id !== memberId)
              }));
            } else {
              Alert.alert("Error", error || "No se pudo eliminar al miembro.");
            }
          }
        }
      ]
    );
  };

  const openSearchModal = async (equipoId: string) => {
    setSelectedEquipoId(equipoId);
    setShowSearchModal(true);
    setSearchQuery("");
    setLoadingSearch(true);

    if (user?.organizacion_id) {
      const { data, error } = await fetchUsuariosOrganizacion(user.organizacion_id, equipoId);
      if (!error) {
        setAvailableUsers(data);
      }
    }
    setLoadingSearch(false);
  };

  const handleAddMember = async (usuarioId: string) => {
    if (!selectedEquipoId) return;

    const { success, error } = await addMiembroEquipo(selectedEquipoId, usuarioId);
    if (success) {
      // Recargar miembros del equipo
      const { data } = await fetchMiembrosEquipo(selectedEquipoId);
      setMiembros(prev => ({ ...prev, [selectedEquipoId]: data }));
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

      <FlatList
        data={equipos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.infoSection}>
            <Text style={styles.title}>Mis equipos</Text>
            <Text style={styles.desc}>Equipos a los que perteneces.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={64} color={colors.accent} />
            <Text style={styles.emptyText}>No tienes equipos asignados actualmente.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const isLeader = item.leader_id === user?.id;
          const teamMembers = miembros[item.id] || [];
          const isLoadingM = loadingMiembros[item.id];

          return (
            <View style={[styles.card, isExpanded && styles.expandedCard]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Users size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.nombre}</Text>
                  <Text style={styles.cardSubtitle}>
                    {isLeader ? "Eres el líder de este equipo" : "Eres miembro"}
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color={colors.accent} />
                ) : (
                  <ChevronDown size={20} color={colors.accent} />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.cardContent}>
                  <View style={styles.divider} />

                  {isLoadingM ? (
                    <ActivityIndicator style={styles.loader} color={colors.primary} />
                  ) : (
                    <>
                      <View style={styles.membersList}>
                        {teamMembers.map((member, index) => (
                          <View key={member.id}>
                            <View style={styles.memberItem}>
                              <View style={styles.avatar}>
                                {member.foto_url ? (
                                  <Image source={{ uri: member.foto_url }} style={styles.avatarImg} />
                                ) : (
                                  <Text style={styles.avatarInitial}>
                                    {member.nombre.substring(0, 2).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <View style={styles.memberInfo}>
                                <View style={styles.nameRow}>
                                  <Text style={styles.memberName}>{member.nombre}</Text>
                                  {member.id === item.leader_id && (
                                    <View style={[styles.leaderBadge, { backgroundColor: colors.primary }]}>
                                      <Crown size={12} color="#FFF" />
                                      <Text style={styles.leaderText}>Líder</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.memberEmail}>{member.correo}</Text>
                              </View>
                              {isLeader && member.id !== user?.id && (
                                <TouchableOpacity
                                  style={styles.deleteButton}
                                  onPress={() => handleRemoveMember(item.id, member.id, member.nombre)}
                                >
                                  <Trash2 size={16} color="#ef4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                            {(index < teamMembers.length - 1) && (
                              <View style={styles.memberDivider} />
                            )}
                          </View>
                        ))}
                      </View>
                      {isLeader && (
                        <>
                          <View style={styles.memberDivider} />
                          <TouchableOpacity
                            style={styles.addButtonFull}
                            onPress={() => openSearchModal(item.id)}
                          >
                            <UserPlus size={18} color="#FFF" />
                            <Text style={styles.addButtonFullText}>Añadir miembro</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir Miembro</Text>
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
              <ScrollView style={styles.resultsList}>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
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
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    overflow: 'hidden',
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
  expandedCard: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.primary,
  },
  cardContent: {
    paddingHorizontal: 0,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.2,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  memberDivider: {
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.15,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  loader: {
    padding: 20,
  },
  membersList: {
    paddingBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 14,
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
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  memberEmail: {
    fontSize: 13,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  addButtonFullText: {
    fontSize: 14,
    fontWeight: "600",
    color: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.foreground,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitialSmall: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.accent,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  resultEmail: {
    fontSize: 13,
    color: colors.accent,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.accent,
    fontSize: 16,
  },
});
