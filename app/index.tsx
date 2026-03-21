import { ActivityIndicator, View } from "react-native";

/**
 * Ruta "/" — evita +not-found al abrir la app.
 * Las redirecciones (login vs post-login) las hace `app/_layout.tsx` según sesión.
 */
export default function RootIndex() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
