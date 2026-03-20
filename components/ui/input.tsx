import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { LIGHT_THEME } from "@/constants/theme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  style,
  ...rest
}: InputProps) {
  const inputStyles = [
    styles.input,
    style,
  ];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput style={inputStyles} placeholderTextColor="#9CA3AF" {...rest} />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#0f766e",
    letterSpacing: 0.3,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 16,
    borderColor: '#bfdbfe',
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: "#EF4444",
  },
});

