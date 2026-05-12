import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Check, X, Search, Trash2, Users, UserPlus, Key } from "lucide-react-native";

import { useTheme } from "@/context/theme";
import { ThemeColors } from "@/constants/colors";
import {
  getOrganizationMembers,
  getPendingInvitations,
  getOrganizationTeams,
  acceptUserInvitation,
  removeUser,
  toggleSharePermission,
  OrganizacionUsuario
} from "@/backend/user-functions";

type TabType = 'miembros' | 'invitaciones';

export default function OrganizacionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('miembros');
  const [search, setSearch] = useState("");
  const [selectedEquipo, setSelectedEquipo] = useState<string>("Todos");

  const [invitaciones, setInvitaciones] = useState<OrganizacionUsuario[]>([]);
  const [miembros, setMiembros] = useState<OrganizacionUsuario[]>([]);
  const [equipos, setEquipos] = useState<{id: string, nombre: string}[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [miembrosRes, invitacionesRes, equiposRes] = await Promise.all([
      getOrganizationMembers(),
      getPendingInvitations(),
      getOrganizationTeams()
    ]);

    if (miembrosRes.error) Alert.alert("Error", miembrosRes.error);
    else setMiembros(miembrosRes.data || []);

    if (invitacionesRes.error) Alert.alert("Error", invitacionesRes.error);
    else setInvitaciones(invitacionesRes.data || []);

    if (equiposRes.error) console.log("Error cargando equipos:", equiposRes.error);
    else setEquipos(equiposRes.data || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

    const handleAceptar = async (id: string) => {
      Alert.alert("Aceptar", "¿Deseas aceptar a este usuario?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Aceptar", onPress: async () => {
            const { success, error } = await acceptUserInvitation(id);
            if (success) {
              Alert.alert("Éxito", "Usuario aceptado correctamente."); // Agregamos este aviso
              loadData();
            }
            else { Alert.alert("Error", error || "No se pudo aceptar"); }
        }}
      ]);
    };

  const handleTogglePermission = async (user: OrganizacionUsuario) => {
    const newVal = !user.puede_compartir;
    const { success, error } = await toggleSharePermission(user.id, newVal);
    if (success) {
      loadData();
    } else {
      Alert.alert("Error", error || "No se pudo cambiar el permiso");
    }
  };

  const handleEliminar = async (id: string) => {
    Alert.alert("Eliminar", "¿Eliminar miembro de la organización?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          const { success, error } = await removeUser(id);
          if (success) { loadData(); }
          else { Alert.alert("Error", error || "No se pudo eliminar"); }
      }}
    ]);
  };

  const filteredMiembros = miembros.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesEquipo = selectedEquipo === "Todos" || (m.equipos && m.equipos.includes(selectedEquipo));
    return matchesSearch && matchesEquipo;
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Organización</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'miembros' && styles.tabItemActive]}
          onPress={() => setActiveTab('miembros')}
        >
          <Users size={20} color={activeTab === 'miembros' ? colors.primary : colors.subText} />
          <Text style={[styles.tabText, activeTab === 'miembros' && styles.tabTextActive]}>Miembros</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'invitaciones' && styles.tabItemActive]}
          onPress={() => setActiveTab('invitaciones')}
        >
          <View>
            <UserPlus size={20} color={activeTab === 'invitaciones' ? colors.primary : colors.subText} />
            {invitaciones.length > 0 && <View style={styles.badge} />}
          </View>
          <Text style={[styles.tabText, activeTab === 'invitaciones' && styles.tabTextActive]}>Invitaciones</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        
        {activeTab === 'miembros' ? (
          <>
            <View style={styles.searchContainer}>
              <Search size={20} color={colors.subText} style={{marginRight: 8}} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre..."
                placeholderTextColor={colors.subText}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Filtro horizontal de equipos */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Filtrar por Equipo:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamFilters}>
                <TouchableOpacity
                  onPress={() => setSelectedEquipo("Todos")}
                  style={[styles.teamChip, selectedEquipo === "Todos" && {backgroundColor: colors.primary}]}
                >
                  <Text style={[styles.teamChipText, selectedEquipo === "Todos" && {color: 'white'}]}>Todos</Text>
                </TouchableOpacity>
                {equipos.map(eq => (
                  <TouchableOpacity
                    key={eq.id}
                    onPress={() => setSelectedEquipo(eq.nombre)}
                    style={[styles.teamChip, selectedEquipo === eq.nombre && {backgroundColor: colors.primary}]}
                  >
                    <Text style={[styles.teamChipText, selectedEquipo === eq.nombre && {color: 'white'}]}>{eq.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.sectionTitle}>Miembros activos ({filteredMiembros.length})</Text>
            {filteredMiembros.map(item => (
              <View key={item.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nameText}>{item.nombre}</Text>
                  <Text style={styles.subText}>{item.equipos?.join(', ') || 'Sin equipo'}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleTogglePermission(item)}
                    style={[styles.permBtn, {borderColor: item.puede_compartir ? colors.primary : colors.subText}]}
                  >
                    <Key size={18} color={item.puede_compartir ? colors.primary : colors.subText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEliminar(item.id)}>
                    <Trash2 size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Solicitudes pendientes ({invitaciones.length})</Text>
            {invitaciones.map(item => (
              <View key={item.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nameText}>{item.nombre}</Text>
                  <Text style={styles.subText}>{item.correo}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.iconBtn, {backgroundColor: colors.primary}]} onPress={() => handleAceptar(item.id)}>
                    <Check size={18} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, {backgroundColor: colors.danger}]} onPress={() => handleEliminar(item.id)}>
                    <X size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: colors.text },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.surface || '#eee', marginHorizontal: 20 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.subText },
  tabTextActive: { color: colors.primary, fontWeight: 'bold' },
  badge: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.subText, marginBottom: 15, textTransform: 'uppercase' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface || '#f5f5f5', borderRadius: 12, marginBottom: 12 },
  nameText: { fontSize: 16, fontWeight: '600', color: colors.text },
  subText: { fontSize: 13, color: colors.subText || '#666' },
  actionRow: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  permBtn: { padding: 6, borderRadius: 8, borderWidth: 1 },
  iconBtn: { padding: 8, borderRadius: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface || '#f0f0f0', paddingHorizontal: 15, borderRadius: 12, marginBottom: 15, height: 48 },
  searchInput: { flex: 1, color: colors.text },
  filterSection: { marginBottom: 20 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: colors.subText, marginBottom: 8 },
  teamFilters: { flexDirection: 'row' },
  teamChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#eee', marginRight: 8 },
  teamChipText: { fontSize: 12, color: '#666' },
  loadingRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }
});
