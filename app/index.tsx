
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { getUserData } from "@/backend/auth-functions";
import { ROLES } from "../constants/roles";


function MisEquiposContent() {
  return (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Mis equipos</Text>
      <Text>Contenido de Mis equipos...</Text>
    </View>
  );
}

function EquiposContent() {
  return (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Equipos</Text>
      <Text>Contenido de Equipos...</Text>
    </View>
  );
}

function OrganizacionContent() {
  return (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Organización</Text>
      <Text>Contenido de Organización...</Text>
    </View>
  );
}

export default function RootIndex() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminOption, setAdminOption] = useState<"misequipos" | "equipos" | "organizacion" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getUserData();
        if (!user) {
          setError("No se pudo obtener el usuario. Inicia sesión nuevamente.");
          setLoading(false);
          return;
        }
        // Buscar el rol en user_metadata o en el objeto user (solo propiedades válidas)
        const rol = user.user_metadata?.rol_id ?? user.user_metadata?.rol ?? user.role;
        if (rol === ROLES.admin || rol === 1 || rol === "admin") {
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
      <Text style={styles.title}>Menú principal</Text>
      {isAdmin && !showAdmin && (
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowAdmin(true)}>
          <Text style={styles.menuButtonText}>Administrar</Text>
        </TouchableOpacity>
      )}
      {isAdmin && showAdmin && (
        <View style={styles.adminContainer}>
          <Text style={styles.sectionTitle}>Administración</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionButton, adminOption === "misequipos" && styles.selectedButton]}
              onPress={() => setAdminOption("misequipos")}
            >
              <Text style={styles.optionText}>Mis equipos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, adminOption === "equipos" && styles.selectedButton]}
              onPress={() => setAdminOption("equipos")}
            >
              <Text style={styles.optionText}>Equipos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, adminOption === "organizacion" && styles.selectedButton]}
              onPress={() => setAdminOption("organizacion")}
            >
              <Text style={styles.optionText}>Organización</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContainer}>
            {adminOption === "misequipos" && <MisEquiposContent />}
            {adminOption === "equipos" && <EquiposContent />}
            {adminOption === "organizacion" && <OrganizacionContent />}
            {!adminOption && (
              <Text style={styles.hintText}>Selecciona una opción para administrar</Text>
            )}
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => { setShowAdmin(false); setAdminOption(null); }}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}
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
  menuButton: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 24,
  },
  menuButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  adminContainer: {
    width: "100%",
    alignItems: "center",
  },
  optionsRow: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 16,
  },
  optionButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  selectedButton: {
    backgroundColor: "#cce6ff",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
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
  backButton: {
    marginTop: 24,
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
});
