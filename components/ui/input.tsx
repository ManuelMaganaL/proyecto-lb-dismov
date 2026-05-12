import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { useTheme } from "@/context/theme";
import { ThemeColors } from "@/constants/colors";

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
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const inputStyles = [
    styles.input,
    style,
  ];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput style={inputStyles} placeholderTextColor={colors.accent} {...rest} />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.3,
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
    borderColor: colors.foreground,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
});

