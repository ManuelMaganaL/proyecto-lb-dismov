import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Users, UserCog, Building2 } from "lucide-react-native";
import { getUserData, allowAccess } from "@/backend/auth-functions";
import { ROLES } from "../../../constants/roles";


export default function Administrar() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getUserData();
        if (!user) {
          setError("No se pudo obtener el usuario. Inicia sesión nuevamente.");
          setLoading(false);
          return;
        }
        const canAccess = await allowAccess(user.id, ROLES.admin);
        if (canAccess) {
          setIsAdmin(true);
        } else {
          setError("No tienes permisos de administrador.");
        }
      } catch (e) {
        setError("Error al obtener el usuario o rol.");
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

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#c00", fontSize: 16, textAlign: "center" }}>{error}</Text>
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
            <Users size={44} color={'#222'} />
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
            <UserCog size={44} color={'#222'} />
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
            <Building2 size={44} color={'#222'} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
    backgroundColor: "#fff",
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
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginHorizontal: 0,
    width: '92%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    // transition removed (not valid in React Native)
  },
  selectedCard: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f6ff',
    shadowOpacity: 0.18,
    elevation: 7,
  },
  iconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    shadowColor: '#2563eb',
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
    color: '#1e293b',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748b',
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
    color: "#888",
    marginTop: 32,
  },
});
