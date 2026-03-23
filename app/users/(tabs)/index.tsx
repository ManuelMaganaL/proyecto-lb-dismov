import { ActivityIndicator } from 'react-native';
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react-native";
import { Alert, Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import ImageViewing from "react-native-image-viewing";

import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import { useTheme } from '@/context/theme';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { validateEmail } from '@/utils/form-validation';
import { getProfileData, updateProfileData, uploadProfileAvatar } from "@/backend/user-functions";
import { logout } from '@/backend/auth-functions';


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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const previewAnim = useRef(new Animated.Value(0)).current;

  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Validaciones en tiempo real
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Validar nombre
  useEffect(() => {
    if (!fullName.trim()) {
      setNameError("El nombre no puede estar vacío.");
    } else {
      setNameError(null);
    }
  }, [fullName]);

  // Validar correo
  useEffect(() => {
    if (!email.trim()) {
      setEmailError("El correo no puede estar vacío.");
    } else if (!validateEmail(email.trim())) {
      setEmailError("Correo no válido.");
    } else {
      setEmailError(null);
    }
  }, [email]);

  // Validar contraseña (si se ingresa)
  useEffect(() => {
    if (newPassword && newPassword.length > 0 && newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.");
    } else {
      setPasswordError(null);
    }
  }, [newPassword]);

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
      setToast({ message: "Necesitas permitir el acceso a tus fotos para elegir un avatar.", type: "error" });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2500);
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
      setToast({ message: "No se pudo obtener la imagen seleccionada.", type: "error" });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2500);
      return;
    }

    // Optimización: redimensionar y comprimir
    let manipulated = null;
    try {
      manipulated = await ImageManipulator.manipulateAsync(
        selectedUri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
    } catch (e) {
      setIsError(true);
      setMessage("No se pudo optimizar la imagen.");
      setToast({ message: "No se pudo optimizar la imagen.", type: "error" });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2500);
      return;
    }

    setUpdatingAvatar(true);
    setAvatarUrl(manipulated.uri);
    setMessage("Actualizando foto de perfil...");
    setIsError(false);

    const { publicUrl, error: uploadError } = await uploadProfileAvatar({
      fileUri: manipulated.uri,
      fileName: selectedAsset.fileName ? selectedAsset.fileName.replace(/\.[^.]+$/, '.jpg') : undefined,
      mimeType: 'image/jpeg',
    });

    if (uploadError || !publicUrl) {
      setIsError(true);
      setMessage(uploadError ?? "No se pudo subir la foto de perfil.");
      setToast({ message: uploadError ?? "No se pudo subir la foto de perfil.", type: "error" });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2500);
      setUpdatingAvatar(false);
      return;
    }

    const { success, error } = await updateProfileData({ avatarUrl: publicUrl });

    if (!success) {
      setIsError(true);
      setMessage(error ?? "No se pudo actualizar la foto de perfil.");
      setToast({ message: error ?? "No se pudo actualizar la foto de perfil.", type: "error" });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2500);
      setUpdatingAvatar(false);
      return;
    }

    setAvatarUrl(publicUrl);
    setIsError(false);
    setToast({ message: "Foto de perfil actualizada.", type: "success" });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 2000);
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
            setToast({ message: error ?? "No se pudo quitar la foto de perfil.", type: "error" });
            if (toastTimeout.current) clearTimeout(toastTimeout.current);
            toastTimeout.current = setTimeout(() => setToast(null), 2500);
            setUpdatingAvatar(false);
            return;
          }

          setIsError(false);
          setMessage("Foto de perfil eliminada.");
          setToast({ message: "Foto de perfil eliminada.", type: "success" });
          if (toastTimeout.current) clearTimeout(toastTimeout.current);
          toastTimeout.current = setTimeout(() => setToast(null), 2000);
          setUpdatingAvatar(false);
        },
      },
    ]);
  };

  const hasValidationErrors = !!nameError || !!emailError || !!passwordError;

  const handleSave = async () => {
    if (hasValidationErrors) {
      setToast({ message: "Corrige los errores antes de guardar.", type: "error" });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2500);
      return;
    }
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
      setToast({ message: error ?? "No se pudo actualizar el perfil.", type: "error" });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 2500);
      setSaving(false);
      return;
    }

    setIsError(false);
    setToast({ message: "Perfil actualizado.", type: "success" });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 2000);
    setNewPassword("");
    setSaving(false);
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
      if (confirmLogout) {
        const { success, error } = await logout();
        if (!success) {
          console.log("Error logout:", error);
        } else {
          router.replace("/auth/login");
        }
      }
    } else {
      Alert.alert(
        'Cerrar sesión',
        '¿Estás seguro de que quieres cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar sesión',
            style: 'destructive',
            onPress: async () => {
              const { success, error } = await logout();
              if (!success) {
                console.log("Error logout:", error);
              } else {
                router.replace("/auth/login");
              }
            },
          },
        ]
      );
    }
  };

  return (
    <>
      {loading && (
        <View
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 100,
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Toast flotante */}
      {toast && (
        <View style={{
          position: 'absolute',
          top: 68, // bajado de 64 a 72
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <View style={{
            backgroundColor: toast.type === 'success' ? colors.success : colors.danger,
            borderColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 18,
            paddingVertical: 12,
            width: '92%',
            maxWidth: 480,
            alignItems: 'center',
            shadowColor: colors.text,
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, textAlign: 'center' }}>{toast.message}</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { paddingBottom: 100 }]} // deja espacio para el botón fijo
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
                  <Pencil size={18} color={colors.background} strokeWidth={2.5} />
                ) : (
                  <Plus size={20} color={colors.background} strokeWidth={2.8} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Nombre"
            placeholder="Tu nombre"
            value={fullName}
            onChangeText={setFullName}
            error={nameError ?? undefined}
            accessible
            accessibilityLabel="Campo de nombre"
            testID="input-nombre"
          />

          <Input
            label="Correo"
            placeholder="tu@correo.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            error={emailError ?? undefined}
            accessible
            accessibilityLabel="Campo de correo electrónico"
            testID="input-correo"
          />

          <Input
            label="Nueva contraseña"
            placeholder="Dejar vacío para no cambiar"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            error={passwordError ?? undefined}
            accessible
            accessibilityLabel="Campo de nueva contraseña"
            testID="input-password"
          />

          {/* Mensaje debajo de los inputs eliminado, solo se usa Toast flotante */}

          <Animated.View
            accessible
            accessibilityLabel="Botón guardar cambios"
            testID="btn-guardar"
            style={{
              marginTop: 14,
              transform: [{ scale: saving ? 0.97 : 1 }],
            }}
          >
            <Button
              title="Guardar cambios"
              onPress={handleSave}
              loading={saving || loading}
              disabled={saving || loading || hasValidationErrors}
            />
          </Animated.View>

          <StatusBar style="auto" />
        </ScrollView>
          {/* Botón fijo abajo */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.background,
              padding: 20,
              paddingBottom: 32,
              borderTopWidth: 1,
              borderTopColor: colors.foreground,
              zIndex: 10,
            }}
          >
            <Button
              variant="danger"
              title="Cerrar sesión"
              onPress={handleLogout}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      <ImageViewing
        images={previewImages}
        imageIndex={0}
        visible={avatarPreviewVisible && previewImages.length > 0}
        onRequestClose={() => setAvatarPreviewVisible(false)}
        backgroundColor={colors.text}
        doubleTapToZoomEnabled={true}
        HeaderComponent={() => (
          <View
            style={{
              backgroundColor: colors.text,
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
                <ArrowLeft size={20} color={colors.background} strokeWidth={3} />
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
                <Pencil size={20} color={colors.background} strokeWidth={2.4} />
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
                <Trash2 size={20} color={colors.danger} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        // FooterComponent removed
      />
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 20,
    padding: 20,
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
  avatarBox: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 18,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: colors.foreground,
  },
  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 24,
  },
  avatarEditButton: {
    position: 'absolute',
    right: -10,
    bottom: -4,
    borderRadius: 999,
    backgroundColor: colors.text,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.foreground,
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
    color: colors.background,
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
    color: colors.foreground,
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
    backgroundColor: colors.success,
    color: colors.text,
  },
  error: {
    backgroundColor: colors.danger,
    color: colors.text,
  },
  logoutButton: {
    marginTop: 12,
  },
});
