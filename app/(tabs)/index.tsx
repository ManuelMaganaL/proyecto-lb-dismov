import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfileData, logout, updateProfileData } from "@/backend/user-functions";

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

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

  const initials = useMemo(() => {
    const source = fullName.trim() || email.trim() || "U";
    return source.slice(0, 2).toUpperCase();
  }, [email, fullName]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const { success, error } = await updateProfileData({
      fullName,
      email,
      avatarUrl,
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Ve y actualiza tus datos de cuenta.</Text>

      <View style={styles.avatarBox}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
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
        label="Foto de perfil (URL)"
        placeholder="https://..."
        value={avatarUrl}
        onChangeText={setAvatarUrl}
        autoCapitalize="none"
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
    marginBottom: 12,
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
