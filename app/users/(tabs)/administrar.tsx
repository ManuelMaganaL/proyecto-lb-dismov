import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Users, UserCog, Building2 } from "lucide-react-native";

import { useTheme } from "@/context/theme";
import { ThemeColors } from "@/constants/colors";
import { getUserData, allowAccess } from "@/backend/auth-functions";
import { ROLES } from "@/constants/roles";



export default function Administrar() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
      const adminAccess = await allowAccess(user.id, ROLES.admin);
      setIsAdmin(adminAccess);
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
      <View style={styles.header}>
        <Text style={styles.title}>Administración</Text>
        <Text style={styles.subtitle}>Gestiona tus equipos y organización.</Text>
      </View>
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
        {isAdmin && (
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
        )}
        {isAdmin && (
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
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  header: {
    width: '100%',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.accent,
    fontSize: 15,
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginHorizontal: 0,
    width: '92%',
    maxWidth: 420,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: colors.foreground,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    shadowOpacity: 0.08,
    elevation: 5,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    color: colors.text,
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
