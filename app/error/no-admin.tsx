import { View, Text } from "react-native";
import { Settings } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/button";

export default function NoUsuario() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Settings size={40}/>
      <Text>Lo lamentamos pero no tienes acceso a las pantallas de administradores.</Text>
    
      <Button
        title="Regresar"
        onPress={() => router.replace("/users/(tabs)")}
      />
    </View>
  );
}