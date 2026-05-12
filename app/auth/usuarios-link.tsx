// Pagina que redirige a las tabs de usuarios
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { allowAccess, getUserData } from "@/backend/auth-functions";
import { ROLES } from "@/constants/roles";

export default function UsuariosLink() {
  const router = useRouter();
  
  // Verifica que puedas acceder a esta pantalla con tu rol
  useEffect(() => {
    const getAccessPermission = async () => {
      const user = await getUserData();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      
      const canAccess = await allowAccess(user.id, ROLES.user);
      if (canAccess) {
        router.replace("/users/(tabs)/historial");
      } else {
        router.replace("/error/no-usuario");
      }
    };
    getAccessPermission();
  }, [])

  return (
    <></>
  )
}