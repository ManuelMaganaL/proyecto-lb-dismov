import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { X, Search, UserPlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { triggerHapticImpact } from "@/utils/haptics";

interface SearchMemberModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  availableUsers: any[];
  onAddMember: (id: string) => void;
  colors: any;
}

export function SearchMemberModal({
  visible,
  onClose,
  searchQuery,
  setSearchQuery,
  loading,
  availableUsers,
  onAddMember,
  colors
}: SearchMemberModalProps) {
  const styles = createStyles(colors);

  const filteredUsers = availableUsers.filter(u =>
    u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.correo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Añadir a la organización</Text>
            <TouchableOpacity onPress={onClose}>
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

          {loading ? (
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
                    onPress={() => {
                      triggerHapticImpact(Haptics.ImpactFeedbackStyle.Light);
                      onAddMember(u.id);
                    }}
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
                          {u.equipos.map((equipoNombre: string, idx: number) => (
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
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.surface || colors.foreground,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.foreground,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 52,
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
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: colors.surface || colors.foreground,
    borderWidth: 1.5,
    borderColor: colors.foreground,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitialSmall: {
    fontSize: 18,
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
