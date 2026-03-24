import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, StyleSheet, Image } from "react-native";

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
        router.replace("/auth/usuarios-link");
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
      router.replace("/auth/usuarios-link");
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
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logo}
          />
          <Text style={styles.appName}>Crypto Share</Text>
          <Text style={styles.appSubtitle}>Comparte claves de forma segura</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Inicia Sesión</Text>

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

          <View style={styles.buttonContainer}>
            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={isSubmitting}
              disabled={isDisabled}
            />
          </View>

          <Text
            style={styles.signupText}
            onPress={() => { router.replace("/auth/signup") }}
          >
            ¿No tienes una cuenta?{" "}
            <Text style={styles.signupLink}>Regístrate</Text>
          </Text>
        </View>
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
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: colors.accent,
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 8,
  },
  signupText: {
    marginTop: 20,
    textAlign: 'center',
    color: colors.accent,
    fontSize: 14,
  },
  signupLink: {
    color: colors.links,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.danger,
  },
  errorText: {
    color: colors.text,
    fontSize: 13,
    textAlign: 'center',
  }
})