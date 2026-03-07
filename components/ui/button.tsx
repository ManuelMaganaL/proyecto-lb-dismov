import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  TextStyle,
  ViewStyle,
} from "react-native";

import { LIGHT_THEME } from "@/constants/theme";

export type ButtonVariant = "main" | "secondary" | "outline";

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  textStyle?: TextStyle | TextStyle[];
  containerStyle?: ViewStyle | ViewStyle[];
}

export function Button({
  title,
  variant = "main",
  loading = false,
  disabled,
  style,
  containerStyle,
  textStyle,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyles = [
    styles.base,
    variant === "main" && styles.main,
    variant === "secondary" && styles.secondary,
    variant === "outline" && styles.outline,
    isDisabled && styles.disabled,
    style,
    containerStyle,
  ];

  const labelStyles = [
    styles.label,
    variant === "secondary" && styles.labelSecondary,
    variant === "outline" && styles.labelOutline,
    textStyle,
  ];

  return (
    <TouchableOpacity
      disabled={isDisabled}
      style={containerStyles}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={styles.label.color as string} />
      ) : (
        <Text style={labelStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  main: {
    backgroundColor: LIGHT_THEME.secondary,
    borderColor: LIGHT_THEME.primary,
  },
  secondary: {
    backgroundColor: LIGHT_THEME.foreground,
    borderColor: LIGHT_THEME.secondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: LIGHT_THEME.primary,
  },
  disabled: {
    backgroundColor: LIGHT_THEME.foreground,
    borderColor: LIGHT_THEME.text,
    opacity: 0.2,
  },
  label: {
    color: LIGHT_THEME.text,
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
  labelSecondary: {
    color: LIGHT_THEME.text,
  },
  labelOutline: {
    color: LIGHT_THEME.text,
  },
});

