import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as CryptoJS from "crypto-js";

import {
  deleteEncryptedDato,
  EncryptedClaveItem,
  getEncryptedDatos,
  updateEncryptedDato,
} from "@/backend/user-functions";

export default function MisClavesScreen() {
  const [items, setItems] = useState<EncryptedClaveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDecrypted, setSelectedDecrypted] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDatoPlano, setEditDatoPlano] = useState("");
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const loadDatos = useCallback(async () => {
    setLoading(true);
    setError("");
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

  useFocusEffect(
    useCallback(() => {
      loadDatos();
      return () => {
        clearHideTimer();
      };
    }, [clearHideTimer, loadDatos])
  );

  const handleDecrypt = (item: EncryptedClaveItem) => {
    const secretKey = process.env.EXPO_PUBLIC_AES_SECRET_KEY || "";

    if (!secretKey) {
      setError("No se encontró la clave secreta para desencriptar.");
      return;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(item.dato_encriptado, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        setError("No se pudo desencriptar el dato. Revisa tu clave de entorno.");
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
    } catch {
      setError("Error al desencriptar el dato.");
    }
  };

  const handleStartEdit = (item: EncryptedClaveItem) => {
    setEditingId(item.id);
    setEditTitulo(item.titulo ?? "");

    const secretKey = process.env.EXPO_PUBLIC_AES_SECRET_KEY || "";
    if (!secretKey) {
      setError("No se encontró la clave secreta para desencriptar.");
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
      return;
    }

    const normalizedTitulo = editTitulo.trim() || "Clave";
    const normalizedDato = editDatoPlano.trim();

    if (!normalizedDato) {
      setError("El dato en texto plano no puede estar vacío.");
      return;
    }

    const encrypted = CryptoJS.AES.encrypt(normalizedDato, secretKey).toString();

    const { success, error: updateError } = await updateEncryptedDato(item.id, {
      titulo: normalizedTitulo,
      dato_encriptado: encrypted,
    });

    if (!success) {
      setError(updateError ?? "No se pudo guardar la edición.");
      return;
    }

    setError("");
    handleCancelEdit();
    await loadDatos();
  };

  const handleDelete = async (item: EncryptedClaveItem) => {
    const { success, error: deleteError } = await deleteEncryptedDato(item.id);

    if (!success) {
      setError(deleteError ?? "No se pudo eliminar la clave.");
      return;
    }

    setError("");
    clearHideTimer();
    setSelectedId(null);
    setSelectedDecrypted("");
    await loadDatos();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis claves cifradas</Text>

      <TouchableOpacity style={styles.refreshButton} onPress={loadDatos} disabled={loading}>
        <Text style={styles.refreshButtonText}>{loading ? "Cargando..." : "Cargar datos"}</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Sin datos todavía.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.titulo ?? "Clave"}</Text>
            <Text numberOfLines={2} style={styles.cardEncrypted}>
              {item.dato_encriptado}
            </Text>
            <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString()}</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.decryptButton} onPress={() => handleDecrypt(item)}>
                <Text style={styles.decryptButtonText}>Desencriptar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={() => handleStartEdit(item)}>
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
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
                    <Text style={styles.actionText}>Guardar</Text>
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
});
