import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { getUserData, allowAccess } from "@/backend/auth-functions";
import { ROLES } from "@/constants/roles";

export default function OrganizacionTab() {
  const router = useRouter();
  
  // Verifica que puedas acceder a esta pantalla con tu rol
  useEffect(() => {
    const getAccessPermission = async () => {
      const user = await getUserData();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      
      const canAccess = await allowAccess(user.id, ROLES.admin);
      if (!canAccess) {
        router.replace("/error/no-admin");
      }
    };
    getAccessPermission();
  }, [])

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Organizacion</Text>
    </View>
  );
}