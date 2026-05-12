import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, Modal, FlatList } from "react-native";
import { ChevronDown } from "lucide-react-native";

import { useTheme } from "@/context/theme";
import { ThemeColors } from "@/constants/colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getUserData, signup, fetchOrganizaciones, Organizacion } from "@/backend/auth-functions";
import { validateEmail } from "@/utils/form-validation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Organización
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organizacion | null>(null);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

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

  // Cargar organizaciones al montar
  useEffect(() => {
    const loadOrgs = async () => {
      const { data } = await fetchOrganizaciones();
      setOrganizaciones(data);
      setLoadingOrgs(false);
    };
    loadOrgs();
  }, []);

  useEffect(() => {
    const isValidEmail = validateEmail(email);
    if (
      isValidEmail &&
      password.length >= 8 &&
      confirmPassword.length >= 8 &&
      password === confirmPassword &&
      name.length > 0 &&
      selectedOrg !== null
    ) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [name, email, password, confirmPassword, selectedOrg])

  const handleSignup = async () => {
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setTimeout(() => setError(null), 5000);
      setConfirmPassword("");
      setIsSubmitting(false);
      return;
    }

    if (!selectedOrg) {
      setError("Selecciona una organización");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await signup(name, email, password, selectedOrg.id);
    if (error || !data) {
      setError(error || "No se pudo registrar el usuario");
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
          <Text style={styles.appSubtitle}>Crea tu cuenta</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Registro</Text>

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
            placeholder="Mínimo 8 caracteres"
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

          {/* Selector de organización */}
          <View style={styles.orgFieldContainer}>
            <Text style={styles.orgLabel}>Organización</Text>
            <TouchableOpacity
              style={styles.orgSelector}
              onPress={() => setShowOrgPicker(true)}
              disabled={loadingOrgs}
            >
              <Text style={[
                styles.orgSelectorText,
                !selectedOrg && styles.orgPlaceholder,
              ]}>
                {loadingOrgs
                  ? "Cargando..."
                  : selectedOrg?.nombre ?? "Selecciona tu organización"}
              </Text>
              <ChevronDown size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Regístrate"
              onPress={handleSignup}
              loading={isSubmitting}
              disabled={isDisabled}
            />
          </View>

          <Text
            style={styles.loginText}
            onPress={() => { router.replace("/auth/login") }}
          >
            ¿Ya tienes una cuenta?{" "}
            <Text style={styles.loginLink}>Inicia Sesión</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Modal para seleccionar organización */}
      <Modal
        visible={showOrgPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrgPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tu organización</Text>
              <TouchableOpacity onPress={() => setShowOrgPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {organizaciones.length === 0 ? (
              <Text style={styles.emptyText}>No hay organizaciones disponibles.</Text>
            ) : (
              <FlatList
                data={organizaciones}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.orgItem,
                      selectedOrg?.id === item.id && styles.orgItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedOrg(item);
                      setShowOrgPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.orgItemText,
                      selectedOrg?.id === item.id && styles.orgItemTextSelected,
                    ]}>
                      {item.nombre}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  loginText: {
    marginTop: 20,
    textAlign: 'center',
    color: colors.accent,
    fontSize: 14,
  },
  loginLink: {
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
  },
  // Org selector
  orgFieldContainer: {
    width: '100%',
    marginBottom: 12,
  },
  orgLabel: {
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  orgSelector: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orgSelectorText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  orgPlaceholder: {
    color: colors.accent,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalClose: {
    fontSize: 20,
    color: colors.accent,
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.accent,
    fontSize: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  orgItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.foreground,
  },
  orgItemSelected: {
    backgroundColor: colors.primary,
  },
  orgItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  orgItemTextSelected: {
    color: '#FFF',
  },
})