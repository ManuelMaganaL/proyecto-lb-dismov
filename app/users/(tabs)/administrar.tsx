import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Users, UserCog, Building2 } from "lucide-react-native";

import { useTheme } from "@/context/theme";
import { getUserData, allowAccess } from "@/backend/auth-functions";
import { ROLES } from "@/constants/roles";



export default function Administrar() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Verificacion de roles
  useEffect(() => {
    async function fetchUser() {
      const user = await getUserData();
      if (!user) {
        router.replace("auth/login")
        setLoading(false);
        return;
      }
      const canAccess = await allowAccess(user.id, ROLES.teamLeader);
      if (!canAccess) {
        router.replace("error/no-admin")
        return;
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administración</Text>
      <View style={styles.cardsContainerVertical}>
        <TouchableOpacity
          style={styles.cardVertical}
          onPress={() => router.push("/admin/misequipos")}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Users size={44} color={colors.text} />
          </View>
          <View style={styles.cardTextWrapper}>
            <Text style={styles.cardTitle}>Mis equipos</Text>
            <Text style={styles.cardDesc}>Gestiona tus equipos asignados</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cardVertical}
          onPress={() => router.push("/admin/equipos")}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <UserCog size={44} color={colors.text} />
          </View>
          <View style={styles.cardTextWrapper}>
            <Text style={styles.cardTitle}>Equipos</Text>
            <Text style={styles.cardDesc}>Administra todos los equipos</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cardVertical}
          onPress={() => router.push("/admin/organizacion")}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Building2 size={44} color={colors.text} />
          </View>
          <View style={styles.cardTextWrapper}>
            <Text style={styles.cardTitle}>Organización</Text>
            <Text style={styles.cardDesc}>Configura la organización</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  cardsContainerVertical: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 24,
    gap: 26,
    width: '100%',
    paddingHorizontal: 0,
  },
  cardVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginHorizontal: 0,
    width: '92%',
    maxWidth: 420,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.background,
    // transition removed (not valid in React Native)
  },
  selectedCard: {
    borderColor: colors.main,
    backgroundColor: colors.foreground,
    shadowOpacity: 0.18,
    elevation: 7,
  },
  iconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    shadowColor: colors.main,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTextWrapper: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  contentContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  hintText: {
    fontSize: 16,
    color: colors.accent,
    marginTop: 32,
  },
});
