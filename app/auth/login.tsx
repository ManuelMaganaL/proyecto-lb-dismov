import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { login } from "@/backend/user-functions";
import { LIGHT_THEME } from "@/constants/theme";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleLogin = async () => {
    setIsSubmitting(true);
    const { data, error } = await login(email, password);
    if (error || !data) {
      setError(error || "No se pudo iniciar sesión");
      
      setPassword("");
      setEmail("");

      setTimeout(() => setError(null), 5000);
    } else {
      router.replace("/(tabs)");
    }

    setIsSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <Text>Inicia Sesión</Text>
      
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

      <Button
        title="Iniciar Sesión"
        onPress={handleLogin}
        loading={isSubmitting}
        disabled={isSubmitting || !email || !password}
      />

      <Text 
        style={styles.signupText}
        onPress={() => {router.push("/auth/signup")}}
      >
        ¿No tienes una cuenta? Regístrate
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  signupText: {
    marginTop: 16,
    color: LIGHT_THEME.links,
    textDecorationLine: "underline",
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
