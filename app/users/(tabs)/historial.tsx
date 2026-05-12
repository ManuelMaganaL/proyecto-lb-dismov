import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as CryptoJS from "crypto-js";

import {
  consumeEncryptedDato,
  deleteEncryptedDato,
  EncryptedClaveItem,
  getEncryptedDatos,
  updateEncryptedDato,
} from "@/backend/crypt-functions";
import { getUserData } from "@/backend/auth-functions";
import { useTheme } from "@/context/theme";
import { ThemeColors } from "@/constants/colors";

export default function MisClavesScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { colors } = useTheme();
  const styles = createStyles(colors);
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

  const isClaveExpired = (item: EncryptedClaveItem): boolean => {
    const now = new Date();
    if (item.fecha_caducidad) {
      const expiryDate = new Date(item.fecha_caducidad);
      if (now > expiryDate) return true;
    }
    const usedViews = item.vistas_usadas ?? 0;
    const maxViews = item.max_vistas ?? 1;
    if (usedViews >= maxViews) return true;
    return false;
  };

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
      <Text style={styles.title}>Historial</Text>
      <Text style={styles.subtitle}>Consulta y gestiona tus claves cifradas.</Text>

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
        <View style={styles.refreshButtonContent}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
          <Text style={[styles.refreshButtonText, loading && styles.refreshButtonLoadingText]}>
            {loading ? "Cargando..." : "Cargar datos"}
          </Text>
        </View>
      </TouchableOpacity>

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
          <SwipeableCard
            item={item}
            isExpired={isClaveExpired(item)}
                        activeFilter={activeFilter}
                        myUserId={myUserId}
            selectedId={selectedId}
            editingId={editingId}
            selectedDecrypted={selectedDecrypted}
            editTitulo={editTitulo}
            editDatoPlano={editDatoPlano}
            actionLoadingId={actionLoadingId}
            onDecrypt={handleDecrypt}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onConfirmDelete={handleConfirmDelete}
            onEditTituloChange={setEditTitulo}
            onEditDatoChange={setEditDatoPlano}
            colors={colors}
          />
        )}
      />
    </View>
  );
}

interface SwipeableCardProps {
  item: EncryptedClaveItem;
  isExpired: boolean;
    activeFilter: "enviadas" | "recibidas";
    myUserId: string;
  selectedId: string | null;
  editingId: string | null;
  selectedDecrypted: string;
  editTitulo: string;
  editDatoPlano: string;
  actionLoadingId: string | null;
  onDecrypt: (item: EncryptedClaveItem) => void;
  onStartEdit: (item: EncryptedClaveItem) => void;
  onCancelEdit: () => void;
  onSaveEdit: (item: EncryptedClaveItem) => void;
  onConfirmDelete: (item: EncryptedClaveItem) => void;
  onEditTituloChange: (text: string) => void;
  onEditDatoChange: (text: string) => void;
  colors: ThemeColors;
}

const SwipeableCard = ({
  item,
  isExpired,
    activeFilter,
    myUserId,
  selectedId,
  editingId,
  selectedDecrypted,
  editTitulo,
  editDatoPlano,
  actionLoadingId,
  onDecrypt,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onConfirmDelete,
  onEditTituloChange,
  onEditDatoChange,
  colors,
}: SwipeableCardProps) => {
  const styles = createStyles(colors);
  const pan = useRef(new Animated.ValueXY()).current;
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canEdit = activeFilter === "enviadas" && !isExpired;
  const canDelete = activeFilter === "enviadas" && !isExpired;

  const resetSwipe = useCallback(() => {
    Animated.timing(pan.x, {
      toValue: 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 10 && (dx < 0 || (dx > 0 && canEdit)),
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) {
          pan.x.setValue(Math.max(dx, -100));
        } else if (dx > 0 && canEdit) {
          pan.x.setValue(Math.min(dx, 100));
        }
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -100) {
          Animated.spring(pan.x, {
            toValue: -100,
            useNativeDriver: false,
          }).start();
        } else if (dx > 100 && canEdit) {
          Animated.spring(pan.x, {
            toValue: 100,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(pan.x, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const listenerId = pan.x.addListener(({ value }) => {
      if (Math.abs(value) === 100) {
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
        }
        autoCloseTimerRef.current = setTimeout(() => {
          resetSwipe();
        }, 1200);
      } else if (Math.abs(value) < 100) {
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
          autoCloseTimerRef.current = null;
        }
      }
    });

    return () => {
      pan.x.removeListener(listenerId);
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [pan, resetSwipe]);

  const handleDelete = () => {
    resetSwipe();
    onConfirmDelete(item);
  };

  const handleEdit = () => {
    if (!canEdit) return;
    resetSwipe();
    onStartEdit(item);
  };

  return (
    <View style={styles.swipeContainer}>
      <Animated.View
        style={[
          styles.card,
          isExpired && styles.cardDisabled,
          { transform: [{ translateX: pan.x }], zIndex: 1 },
        ]}
        {...((canEdit || canDelete) ? panResponder.panHandlers : {})}
      >
        <Text style={[styles.cardTitle, isExpired && styles.cardTitleDisabled]}>{item.titulo ?? "Clave"}</Text>
        <Text numberOfLines={2} style={[styles.cardEncrypted, isExpired && styles.cardEncryptedDisabled]}>
          {activeFilter === "recibidas"
            ? `De: ${item.emisor_nombre || "Usuario"}${item.emisor_correo ? ` (${item.emisor_correo})` : ""}`
            : `Para: ${item.receptor_nombre || "Usuario"}${item.receptor_correo ? ` (${item.receptor_correo})` : ""}`}
        </Text>
        <Text style={[styles.cardDate, isExpired && { opacity: 0.5 }]}>{new Date(item.created_at).toLocaleString()}</Text>
        {item.fecha_caducidad ? (
          <Text style={[styles.expiryInfo, isExpired ? styles.expiryInfoExpired : styles.expiryInfoActive]}>Caduca: {new Date(item.fecha_caducidad).toLocaleString()}</Text>
        ) : (
          <Text style={[styles.expiryInfo, isExpired ? styles.expiryInfoExpired : styles.expiryInfoActive]}>Sin caducidad</Text>
        )}
        <Text style={[styles.viewsInfo, isExpired && { opacity: 0.5 }]}> 
          Vistas: {item.vistas_usadas ?? 0} / {item.max_vistas ?? 1}
        </Text>

        {/* Ocultar botón Desencriptar si está expirada */}
        {!isExpired && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.decryptButton, styles.decryptButtonExpanded]}
              onPress={() => onDecrypt(item)}
            >
              <Text style={styles.decryptButtonText}>Desencriptar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Solo mostrar edición si es enviadas */}
        {canEdit && editingId === item.id ? (
          <View style={styles.editBox}>
            <TextInput
              value={editTitulo}
              onChangeText={onEditTituloChange}
              placeholder="Titulo"
              style={styles.input}
            />
            <TextInput
              value={editDatoPlano}
              onChangeText={onEditDatoChange}
              placeholder="Dato en texto plano"
              style={styles.input}
            />

            <View style={styles.editActionsRow}>
              <TouchableOpacity style={styles.saveButton} onPress={() => onSaveEdit(item)}>
                <Text style={styles.actionText}>
                  {actionLoadingId === item.id ? "Guardando..." : "Guardar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancelEdit}>
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
      </Animated.View>
      {/* Solo mostrar swipe de editar si es enviadas */}
      {canEdit && (
        <View style={styles.swipeEditBackground}>
          <TouchableOpacity style={[styles.swipeEditButton, { opacity: 1 }]} onPress={handleEdit}>
            <Text style={styles.swipeEditText}>Editar</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Solo mostrar swipe de eliminar si es enviadas */}
      {canDelete && (
        <View style={styles.swipeDeleteBackground}>
          <TouchableOpacity style={[styles.swipeDeleteButton, { opacity: 1 }]} onPress={handleDelete}>
            <Text style={styles.swipeDeleteText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.accent,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  filterText: {
    color: colors.accent,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.primary,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  refreshButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  refreshButtonLoadingText: {
    marginLeft: 8,
  },
  list: {
    paddingVertical: 12,
    gap: 12,
  },
  empty: {
    marginTop: 24,
    color: colors.accent,
  },
  card: {
    borderWidth: 1.5,
    borderColor: colors.foreground,
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.surface,
    width: "100%",
    shadowColor: colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardDisabled: {
    opacity: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textDecorationLine: "none",
  },
  cardTitleDisabled: {
    opacity: 0.5,
  },
  cardEncrypted: {
    marginTop: 8,
    color: colors.accent,
    fontSize: 12,
  },
  cardEncryptedDisabled: {
    opacity: 0.5,
  },
  cardDate: {
    marginTop: 8,
    fontSize: 12,
    color: colors.accent,
  },
  viewsInfo: {
    marginTop: 6,
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
  expiryInfo: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  expiryInfoExpired: {
    color: colors.danger,
  },
  expiryInfoActive: {
    color: colors.success,
  },
  decryptButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  decryptButtonExpanded: {
    flex: 1,
  },
  actionsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    marginTop: 10,
    backgroundColor: colors.links,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: colors.danger,
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
    borderColor: colors.foreground,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    color: colors.text,
  },
  editActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.accent,
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
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    padding: 10,
  },
  decryptedLabel: {
    fontWeight: "600",
    marginBottom: 6,
    color: colors.text,
  },
  decryptedText: {
    color: colors.text,
  },
  error: {
    color: colors.danger,
    marginTop: 10,
  },
  toast: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toastSuccess: {
    backgroundColor: colors.success + '25',
    borderWidth: 1,
    borderColor: colors.success,
  },
  toastError: {
    backgroundColor: colors.danger + '25',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  toastText: {
    color: colors.text,
    fontWeight: "500",
  },
  swipeContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },
  swipeDeleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: colors.danger,
    borderRadius: 16,
    zIndex: 0,
  },
  swipeDeleteButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  swipeDeleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  swipeEditBackground: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: colors.links,
    borderRadius: 16,
    zIndex: 0,
  },
  swipeEditButton: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  swipeEditText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
