import { useEffect, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

import { useTheme } from "@/context/theme";
import type { Teamate, EquipoData } from "@/backend/equipos-functions";


export default function SingleTeamTab() {
  const router = useRouter();
  
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [teamates, setTeamates] = useState<Teamate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Obtenemos el ID del equipo desde de la ruta
  let { id } = useLocalSearchParams();
  if (typeof id !== "string") id = id[0];

  // Obtenemos los datos del equipo y sus miembros
  useEffect(() => {
    const fetchTeamData = async () => {

    };
    fetchTeamData();
  }, [id]);

  const handleRemoveUser = () => {

  }

  const handleAddUser = () => {

  }

  const handleChangeLeader = () => {

  }

  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingLabel}>Cargando…</Text>
      </View>
    );
  }

  return (
    <></>
  )
}

const createStyles = (colors: any) => StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingLabel: {
    fontSize: 15,
    color: colors.text,
    opacity: 0.7,
  },
})