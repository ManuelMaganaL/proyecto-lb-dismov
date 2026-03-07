import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserData, signup } from "@/backend/user-functions";
import { LIGHT_THEME } from "@/constants/theme";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkUser() {
      const user = await getUserData();
      if (user) router.push("/");
      
      setIsLoading(false);
    }

    checkUser();
  }, []);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setTimeout(() => setError(null), 5000);
      setConfirmPassword("");
      return;
    }

    const { data, error } = await signup(email, password);
    if (error || !data) {
      setError(error || "No se pudo registrar el usuario");
      
      setPassword("");
      setEmail("");

      setTimeout(() => setError(null), 5000);
    } else {
      router.push("/");
    }
  };

  return (
    <View style={styles.container}>
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
        disabled={isLoading || !email || !password}
      />

      <Text 
        style={styles.loginText}
        onPress={() => {router.push("/auth/login")}}
      >
        ¿Ya tienes una cuenta? Inicia Sesión
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