import { View, Text, StyleSheet } from "react-native";
import { Settings } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { Button } from "@/components/ui/button";

export default function NoAdmin() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Settings size={48} color={colors.text} />
      <Text style={styles.title}>Acceso restringido</Text>
      <Text style={styles.desc}>
        Lo lamentamos, pero no tienes acceso a las pantallas de administradores.
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Regresar"
          onPress={() => router.replace("/users/(tabs)")}
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