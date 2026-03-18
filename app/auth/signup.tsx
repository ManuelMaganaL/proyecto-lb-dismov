import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, StyleSheet } from "react-native"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup } from "@/backend/user-functions";
import { LIGHT_THEME } from "@/constants/theme";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSignup = async () => {
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setTimeout(() => setError(null), 5000);
      setConfirmPassword("");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await signup(email, password);
    if (error || !data) {
      setError(error || "No se pudo registrar el usuario");
      
      setPassword("");
      setEmail("");

      setTimeout(() => setError(null), 5000);
    } else {
      router.replace("/(tabs)");
    }

    setIsSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="always"
      >
        <Text>Registro</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="Correo"
          placeholder="Ingresa tu correo"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Input
          label="Confirma contraseña"
          placeholder="Vuelve a ingresar tu contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Button
          title="Registrate"
          onPress={handleSignup}
          loading={isSubmitting}
          disabled={isSubmitting || !email || !password}
        />

        <Text
          style={styles.loginText}
          onPress={() => {router.push("/auth/login")}}
        >
          ¿Ya tienes una cuenta? Inicia Sesión
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_THEME.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginText: {
    marginTop: 16,
    color: LIGHT_THEME.links,
  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: LIGHT_THEME.danger,
  },
  errorText: {
    color: LIGHT_THEME.text,
  }
})