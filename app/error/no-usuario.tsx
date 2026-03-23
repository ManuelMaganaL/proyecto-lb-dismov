import { View, Text, StyleSheet } from "react-native";
import { Mail } from "lucide-react-native";
import { useTheme } from "@react-navigation/native";

import { Button } from "@/components/ui/button";
import { logout } from "@/backend/auth-functions";

export default function NoUsuario() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <Mail size={48} color={colors.text} />
      <Text style={styles.title}>Acceso en revisión</Text>
      <Text style={styles.desc}>
        Tu solicitud para acceder a la empresa sigue en revisión.
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          variant="danger"
          title="Cerrar sesión"
          onPress={handleSignOut}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      padding: 24,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    desc: {
      fontSize: 15,
      color: colors.accent,
      textAlign: "center",
      opacity: 0.8,
    },
    buttonContainer: {
      marginTop: 24,
      width: "100%",
    },
  });