import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, StyleSheet } from "react-native";

import { useTheme } from "@/context/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getUserData, login } from "@/backend/auth-functions";
import { validateEmail } from "@/utils/form-validation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { colors } = useTheme();
  const styles = createStyles(colors);


  useEffect(() => {
    const checkUser = async () => {
      const user = await getUserData();
      if (user) {
        router.replace("/(tabs)");
      }
    }
    checkUser();
  }, [])


  useEffect(() => {
    const isValidEmail = validateEmail(email);

    if (isValidEmail && password.length > 0) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [email, password]);


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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="always"
      >
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
          disabled={isDisabled}
        />

        <Text
          style={styles.signupText}
          onPress={() => {router.replace("/auth/signup")}}
        >
          ¿No tienes una cuenta? Regístrate
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  signupText: {
    marginTop: 16,
    color: colors.links,
    textDecorationLine: "underline",
  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.danger,
  },
  errorText: {
    color: colors.text,
  }
})
