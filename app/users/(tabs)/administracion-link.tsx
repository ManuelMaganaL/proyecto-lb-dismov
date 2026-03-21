// Pagina que redirige a las tabs de administración
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { allowAccess, getUserData } from "@/backend/auth-functions";
import { ROLES } from "@/constants/roles";

export default function AdminLink() {
  const router = useRouter();
  
  useEffect(() => {
    const getAccessPermission = async () => {
      const user = await getUserData();
      if (!user) {
        router.replace("/auth/login");
        return
      }

      const canAccess = await allowAccess(user.id, ROLES.teamLeader);
      if (canAccess) {
        router.replace("/admin/(tabs)");
      } else {
        router.replace("/error/no-admin");
      }
    };
    getAccessPermission();
  }, [])

  return (
    <></>
  )
}
