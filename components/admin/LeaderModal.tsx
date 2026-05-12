import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { X, Search, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { triggerHapticImpact } from "@/utils/haptics";

interface LeaderModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  availableLeaders: any[];
  onAssignLeader: (id: string) => void;
  colors: any;
}

export function LeaderModal({
  visible,
  onClose,
  title,
  searchQuery,
  setSearchQuery,
  loading,
  availableLeaders,
  onAssignLeader,
  colors
}: LeaderModalProps) {
  const styles = createStyles(colors);

  const filteredLeaders = availableLeaders.filter(u =>
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
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Search size={20} color={colors.accent} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar candidato por nombre o correo..."
              placeholderTextColor={colors.accent}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading ? (
            <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />
          ) : (
            <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
              {filteredLeaders.length === 0 ? (
                <Text style={styles.noResults}>No se encontraron candidatos disponibles.</Text>
              ) : (
                filteredLeaders.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={styles.userResult}
                    onPress={() => {
                      triggerHapticImpact(Haptics.ImpactFeedbackStyle.Light);
                      onAssignLeader(u.id);
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
                    </View>
                    <Crown size={20} color={colors.primary} />
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
  noResults: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.accent,
    fontSize: 16,
  },
});
