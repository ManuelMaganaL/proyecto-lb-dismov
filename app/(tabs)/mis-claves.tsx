import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as CryptoJS from "crypto-js";

import {
  consumeEncryptedDato,
  deleteEncryptedDato,
  EncryptedClaveItem,
  getUserData,
  getEncryptedDatos,
  updateEncryptedDato,
} from "@/backend/user-functions";

export default function MisClavesScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [items, setItems] = useState<EncryptedClaveItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"enviadas" | "recibidas">("recibidas");
  const [myUserId, setMyUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDecrypted, setSelectedDecrypted] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDatoPlano, setEditDatoPlano] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const loadDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    const currentUser = await getUserData();
    if (currentUser?.id) {
      setMyUserId(currentUser.id);
    }
    const { data, error: fetchError } = await getEncryptedDatos();

    if (fetchError || !data) {
      setError(fetchError ?? "No se pudo cargar la lista.");
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(data);
    setSelectedId(null);
    setSelectedDecrypted("");
    setEditingId(null);
    setEditTitulo("");
    setEditDatoPlano("");
    setLoading(false);
  }, []);

  const visibleItems = items.filter((item) => {
    if (!myUserId) return true;
    if (activeFilter === "enviadas") {
      return item.emisor_id === myUserId;
    }
    return item.receptor_id === myUserId;
  });

  useFocusEffect(
    useCallback(() => {
      loadDatos();
      return () => {
        clearHideTimer();
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
          toastTimerRef.current = null;
        }
      };
    }, [clearHideTimer, loadDatos])
  );

  const handleDecrypt = async (item: EncryptedClaveItem) => {
    const secretKey = process.env.EXPO_PUBLIC_AES_SECRET_KEY || "";

    if (!secretKey) {
      setError("");
      showToast("No se encontró la clave secreta.", "error");
      return;
    }

    try {
      let encryptedPayload = item.dato_encriptado;

      if (activeFilter === "recibidas") {
        const { data: consumed, error: consumeError } = await consumeEncryptedDato(item.id);
        if (consumeError || !consumed) {
          setError("");
          showToast(consumeError ?? "No se pudo consumir la clave.", "error");
          return;
        }

        encryptedPayload = consumed.dato_encriptado;
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === consumed.id
              ? {
                  ...entry,
                  vistas_usadas: consumed.vistas_usadas,
                  max_vistas: consumed.max_vistas,
                }
              : entry
          )
        );
      }

      const bytes = CryptoJS.AES.decrypt(encryptedPayload, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        setError("");
        showToast("No se pudo desencriptar el dato.", "error");
        return;
      }

      setSelectedId(item.id);
      setSelectedDecrypted(decrypted);
      setError("");

      clearHideTimer();
      hideTimerRef.current = setTimeout(() => {
        setSelectedId(null);
        setSelectedDecrypted("");
      }, 4000);
      showToast("Texto plano visible por 4 segundos.", "success");
    } catch {
      setError("");
      showToast("Error al desencriptar el dato.", "error");
    }
  };

  const handleStartEdit = (item: EncryptedClaveItem) => {
    setEditingId(item.id);
    setEditTitulo(item.titulo ?? "");

    const secretKey = process.env.EXPO_PUBLIC_AES_SECRET_KEY || "";
    if (!secretKey) {
      setError("No se encontró la clave secreta para desencriptar.");
      showToast("No se encontró la clave secreta.", "error");
      return;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(item.dato_encriptado, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      setEditDatoPlano(decrypted);
      setError("");
    } catch {
      setEditDatoPlano("");
      setError("No se pudo preparar el modo edición.");
      showToast("No se pudo preparar el modo edición.", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitulo("");
    setEditDatoPlano("");
  };

  const handleSaveEdit = async (item: EncryptedClaveItem) => {
    const secretKey = process.env.EXPO_PUBLIC_AES_SECRET_KEY || "";

    if (!secretKey) {
      setError("No se encontró la clave secreta para guardar cambios.");
      showToast("No se encontró la clave secreta.", "error");
      return;
    }

    const normalizedTitulo = editTitulo.trim() || "Clave";
    const normalizedDato = editDatoPlano.trim();

    if (!normalizedDato) {
      setError("El dato en texto plano no puede estar vacío.");
      showToast("El dato en texto plano no puede estar vacío.", "error");
      return;
    }

    const encrypted = CryptoJS.AES.encrypt(normalizedDato, secretKey).toString();

    setActionLoadingId(item.id);

    const { success, error: updateError } = await updateEncryptedDato(item.id, {
      titulo: normalizedTitulo,
      dato_encriptado: encrypted,
    });

    if (!success) {
      setError(updateError ?? "No se pudo guardar la edición.");
      showToast(updateError ?? "No se pudo guardar la edición.", "error");
      setActionLoadingId(null);
      return;
    }

    setError("");
    showToast("Clave actualizada correctamente.", "success");
    handleCancelEdit();
    await loadDatos();
    setActionLoadingId(null);
  };

  const handleDelete = async (item: EncryptedClaveItem) => {
    setActionLoadingId(item.id);
    const { success, error: deleteError } = await deleteEncryptedDato(item.id);

    if (!success) {
      setError(deleteError ?? "No se pudo eliminar la clave.");
      showToast(deleteError ?? "No se pudo eliminar la clave.", "error");
      setActionLoadingId(null);
      return;
    }

    setError("");
    showToast("Clave eliminada correctamente.", "success");
    clearHideTimer();
    setSelectedId(null);
    setSelectedDecrypted("");
    await loadDatos();
    setActionLoadingId(null);
  };

  const handleConfirmDelete = (item: EncryptedClaveItem) => {
    Alert.alert(
      "Eliminar clave",
      "Esta acción no se puede deshacer. ¿Deseas continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => handleDelete(item) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis claves cifradas</Text>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === "recibidas" && styles.filterButtonActive]}
          onPress={() => setActiveFilter("recibidas")}
        >
          <Text style={[styles.filterText, activeFilter === "recibidas" && styles.filterTextActive]}>Recibidas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === "enviadas" && styles.filterButtonActive]}
          onPress={() => setActiveFilter("enviadas")}
        >
          <Text style={[styles.filterText, activeFilter === "enviadas" && styles.filterTextActive]}>Enviadas</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadDatos} disabled={loading}>
        <Text style={styles.refreshButtonText}>{loading ? "Cargando..." : "Cargar datos"}</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {toast ? (
        <View style={[styles.toast, toast.type === "success" ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}

      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Sin datos todavía.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.titulo ?? "Clave"}</Text>
            <Text numberOfLines={2} style={styles.cardEncrypted}>
              {item.dato_encriptado}
            </Text>
            <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString()}</Text>
            {item.fecha_caducidad ? (
              <Text style={styles.expiryInfo}>Caduca: {new Date(item.fecha_caducidad).toLocaleString()}</Text>
            ) : (
              <Text style={styles.expiryInfo}>Sin caducidad</Text>
            )}
            <Text style={styles.viewsInfo}>
              Vistas: {item.vistas_usadas ?? 0} / {item.max_vistas ?? 1}
            </Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.decryptButton} onPress={() => handleDecrypt(item)}>
                <Text style={styles.decryptButtonText}>Desencriptar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={() => handleStartEdit(item)}>
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleConfirmDelete(item)}>
                <Text style={styles.actionText}>Eliminar</Text>
              </TouchableOpacity>
            </View>

            {editingId === item.id ? (
              <View style={styles.editBox}>
                <TextInput
                  value={editTitulo}
                  onChangeText={setEditTitulo}
                  placeholder="Titulo"
                  style={styles.input}
                />
                <TextInput
                  value={editDatoPlano}
                  onChangeText={setEditDatoPlano}
                  placeholder="Dato en texto plano"
                  style={styles.input}
                />

                <View style={styles.editActionsRow}>
                  <TouchableOpacity style={styles.saveButton} onPress={() => handleSaveEdit(item)}>
                    <Text style={styles.actionText}>
                      {actionLoadingId === item.id ? "Guardando..." : "Guardar"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                    <Text style={styles.actionText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {selectedId === item.id ? (
              <View style={styles.decryptedBox}>
                <Text style={styles.decryptedLabel}>Texto plano:</Text>
                <Text selectable style={styles.decryptedText}>
                  {selectedDecrypted}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  filterButtonActive: {
    borderColor: "#0f766e",
    backgroundColor: "#ccfbf1",
  },
  filterText: {
    color: "#334155",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#115e59",
  },
  refreshButton: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  list: {
    paddingVertical: 12,
    gap: 12,
  },
  empty: {
    marginTop: 24,
    color: "#6b7280",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardEncrypted: {
    marginTop: 8,
    color: "#374151",
    fontSize: 12,
  },
  cardDate: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  },
  viewsInfo: {
    marginTop: 6,
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "500",
  },
  expiryInfo: {
    marginTop: 4,
    fontSize: 12,
    color: "#7c2d12",
    fontWeight: "500",
  },
  decryptButton: {
    marginTop: 10,
    backgroundColor: "#0f766e",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  actionsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    marginTop: 10,
    backgroundColor: "#1d4ed8",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: "#b91c1c",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
  editBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  editActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#0f766e",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#64748b",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  decryptButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  decryptedBox: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#ecfeff",
    borderWidth: 1,
    borderColor: "#99f6e4",
    padding: 10,
  },
  decryptedLabel: {
    fontWeight: "600",
    marginBottom: 6,
  },
  decryptedText: {
    color: "#111827",
  },
  error: {
    color: "#b91c1c",
    marginTop: 10,
  },
  toast: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toastSuccess: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  toastError: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  toastText: {
    color: "#111827",
    fontWeight: "500",
  },
});
