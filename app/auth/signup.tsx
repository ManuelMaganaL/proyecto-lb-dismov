import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, StyleSheet } from "react-native"

import { useTheme } from "@/context/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { signup } from "@/backend/auth-functions";
import { validateEmail } from "@/utils/form-validation";


export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [org, setOrg] = useState<string>("");

  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { colors } = useTheme();
  const styles = createStyles(colors);


  useEffect(() => {

  }, [])


  useEffect(() => {
    const isValidEmail = validateEmail(email);

    if (
      isValidEmail &&
      password.length >= 8 &&
      confirmPassword.length >= 8 &&
      password === confirmPassword &&
      name.length > 0 &&
      org.length > 0
    ) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [name, email, password, confirmPassword, org])


  const handleSignup = async () => {
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setTimeout(() => setError(null), 5000);
      setConfirmPassword("");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await signup(name, email, password, org);
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
          label="Nombre"
          placeholder="Ingresa tu nombre"
          value={name}
          onChangeText={setName}
        />

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

        <Input
          label="Organización"
          placeholder="Ingresa tu organización"
          value={org}
          onChangeText={setOrg}
        />

        <Button
          title="Registrate"
          onPress={handleSignup}
          loading={isSubmitting}
          disabled={isDisabled}
        />

        <Text
          style={styles.loginText}
          onPress={() => {router.replace("/auth/login")}}
        >
          ¿Ya tienes una cuenta? Inicia Sesión
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
  loginText: {
    marginTop: 16,
    color: colors.links,
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