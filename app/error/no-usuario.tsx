import { View, Text } from "react-native";
import { Mail } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { logout } from "@/backend/auth-functions";

export default function NoUsuario() {
  const handleSignOut = async () => {
    await logout();
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Mail size={40}/>
      <Text>Tu solicitud para acceder a la empresa sigue en revisión.</Text>

      <Button
        variant="danger"
        title="Cerrar sesión"
        onPress={handleSignOut}
      />
    </View>
  );
}