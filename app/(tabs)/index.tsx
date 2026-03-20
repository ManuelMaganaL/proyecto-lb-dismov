import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react-native";
import { Alert, Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import ImageViewing from "react-native-image-viewing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfileData, logout, updateProfileData, uploadProfileAvatar } from "@/backend/user-functions";

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const previewAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await getProfileData();
      if (error || !data) {
        setIsError(true);
        setMessage(error ?? "No se pudo cargar el perfil.");
        setLoading(false);
        return;
      }

      setFullName(data.fullName);
      setEmail(data.email);
      setAvatarUrl(data.avatarUrl);
      setLoading(false);
    }

    loadProfile();
  }, []);

  useEffect(() => {
    if (avatarPreviewVisible) {
      previewAnim.setValue(0);
      Animated.timing(previewAnim, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [avatarPreviewVisible, previewAnim]);

  const initials = useMemo(() => {
    const source = fullName.trim() || email.trim() || "U";
    return source.slice(0, 2).toUpperCase();
  }, [email, fullName]);

  const previewImages = useMemo(() => {
    return avatarUrl ? [{ uri: avatarUrl }] : [];
  }, [avatarUrl]);

  const handleOpenAvatarPreview = () => {
    if (!avatarUrl) {
      return;
    }

    setAvatarPreviewVisible(true);
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      setIsError(true);
      setMessage("Necesitas permitir el acceso a tus fotos para elegir un avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const selectedAsset = result.assets[0];
    const selectedUri = selectedAsset?.uri;

    if (!selectedUri) {
      setIsError(true);
      setMessage("No se pudo obtener la imagen seleccionada.");
      return;
    }

    setUpdatingAvatar(true);
    setAvatarUrl(selectedUri);
    setMessage("Actualizando foto de perfil...");
    setIsError(false);

    const { publicUrl, error: uploadError } = await uploadProfileAvatar({
      fileUri: selectedAsset.uri,
      fileName: selectedAsset.fileName ?? undefined,
      mimeType: selectedAsset.mimeType,
    });

    if (uploadError || !publicUrl) {
      setIsError(true);
      setMessage(uploadError ?? "No se pudo subir la foto de perfil.");
      setUpdatingAvatar(false);
      return;
    }

    const { success, error } = await updateProfileData({ avatarUrl: publicUrl });

    if (!success) {
      setIsError(true);
      setMessage(error ?? "No se pudo actualizar la foto de perfil.");
      setUpdatingAvatar(false);
      return;
    }

    setAvatarUrl(publicUrl);
    setIsError(false);
    setMessage("Foto de perfil actualizada.");
    setUpdatingAvatar(false);
  };

  const handleClearAvatar = () => {
    if (!avatarUrl) {
      return;
    }

    Alert.alert("Quitar foto", "Se eliminará la foto de perfil inmediatamente.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar",
        style: "destructive",
        onPress: async () => {
          setAvatarPreviewVisible(false);
          setUpdatingAvatar(true);
          const previousAvatar = avatarUrl;
          setAvatarUrl("");
          setMessage("Quitando foto de perfil...");
          setIsError(false);

          const { success, error } = await updateProfileData({ avatarUrl: "" });

          if (!success) {
            setAvatarUrl(previousAvatar);
            setIsError(true);
            setMessage(error ?? "No se pudo quitar la foto de perfil.");
            setUpdatingAvatar(false);
            return;
          }

          setIsError(false);
          setMessage("Foto de perfil eliminada.");
          setUpdatingAvatar(false);
        },
      },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const { success, error } = await updateProfileData({
      fullName,
      email,
      password: newPassword,
    });

    if (!success) {
      setIsError(true);
      setMessage(error ?? "No se pudo actualizar el perfil.");
      setSaving(false);
      return;
    }

    setIsError(false);
    setMessage("Perfil actualizado. Si cambiaste correo, revisa tu bandeja para confirmar.");
    setNewPassword("");
    setSaving(false);
  };

  const handleLogout = async () => {
    const { success, error } = await logout();
    if (!success) {
      console.log("Error logout:", error);
    } else {
      router.replace("/auth/login");
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Ve y actualiza tus datos de cuenta.</Text>

      <View style={styles.avatarBox}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            activeOpacity={avatarUrl ? 0.85 : 1}
            onPress={handleOpenAvatarPreview}
            disabled={!avatarUrl}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarEditButton}
            onPress={handlePickAvatar}
            disabled={saving || loading || updatingAvatar}
          >
            {avatarUrl ? (
              <Pencil size={12} color="#ffffff" strokeWidth={2.5} />
            ) : (
              <Plus size={13} color="#ffffff" strokeWidth={2.8} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Input
        label="Nombre"
        placeholder="Tu nombre"
        value={fullName}
        onChangeText={setFullName}
      />

      <Input
        label="Correo"
        placeholder="tu@correo.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Input
        label="Nueva contraseña"
        placeholder="Dejar vacío para no cambiar"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      {message ? (
        <Text style={[styles.message, isError ? styles.error : styles.ok]}>{message}</Text>
      ) : null}

      <Button
        title="Guardar cambios"
        onPress={handleSave}
        loading={saving || loading}
        disabled={saving || loading}
      />

      <StatusBar style="auto" />
      <Button
        title="Cerrar sesión"
        onPress={handleLogout}
        containerStyle={styles.logoutButton}
      />
      </ScrollView>

      <ImageViewing
        images={previewImages}
        imageIndex={0}
        visible={avatarPreviewVisible && previewImages.length > 0}
        onRequestClose={() => setAvatarPreviewVisible(false)}
        backgroundColor="#020617"
        doubleTapToZoomEnabled={true}
        HeaderComponent={() => (
          <View
            style={{
              backgroundColor: '#020617',
              width: '100%',
              minHeight: 55,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center', // centra verticalmente
              justifyContent: 'space-between',
              zIndex: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={{
                  width: 35,
                  height: 35,
                  maxWidth: 35,
                  maxHeight: 35,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  borderRadius: 17.5,
                  borderWidth: 0,
                  borderColor: 'transparent',
                }}
                onPress={() => setAvatarPreviewVisible(false)}
                disabled={updatingAvatar}
              >
                <ArrowLeft size={20} color="#ffffff" strokeWidth={3} />
              </TouchableOpacity>
              <Text style={[styles.previewHeaderTitle, { textAlign: 'center' }]}>Vista previa</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={{
                  width: 35,
                  height: 35,
                  maxWidth: 35,
                  maxHeight: 35,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  borderRadius: 17.5,
                  borderWidth: 0,
                  borderColor: 'transparent',
                }}
                onPress={handlePickAvatar}
                disabled={updatingAvatar}
              >
                <Pencil size={20} color="#ffffff" strokeWidth={2.4} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 35,
                  height: 35,
                  maxWidth: 35,
                  maxHeight: 35,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(185,28,28,0.42)',
                  borderRadius: 17.5,
                  borderWidth: 1,
                  borderColor: 'rgba(254,202,202,0.35)',
                }}
                onPress={handleClearAvatar}
                disabled={updatingAvatar || !avatarUrl}
              >
                <Trash2 size={20} color="#fecaca" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        // FooterComponent removed
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingTop: 20,
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: '#334155',
    fontSize: 15,
  },
  avatarBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 24,
  },
  avatarEditButton: {
    position: 'absolute',
    right: -8,
    bottom: -2,
    borderRadius: 999,
    backgroundColor: '#0f172a',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  // previewFooter removed
  previewFooterButton: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.25)',
  },
  previewFooterButtonMuted: {
    backgroundColor: 'rgba(30, 41, 59, 0.86)',
  },
  previewFooterButtonDanger: {
    backgroundColor: 'rgba(185, 28, 28, 0.92)',
  },
  previewFooterButtonDisabled: {
    opacity: 0.6,
  },
  previewFooterButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  previewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    width: '100%',
    paddingTop: 18,
    paddingHorizontal: 12,
    minHeight: 56,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHeaderTitle: {
    color: '#f8fafc',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  previewHeaderDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(185, 28, 28, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254, 202, 202, 0.35)',
  },
  previewHeaderEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.25)',
  },
  message: {
    marginBottom: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ok: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  logoutButton: {
    marginTop: 12,
  },
});
