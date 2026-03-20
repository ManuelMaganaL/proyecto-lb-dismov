import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  TextStyle,
  ViewStyle,
} from "react-native";

import { useTheme } from "@/context/theme";

export type ButtonVariant = "main" | "secondary" | "outline" | "danger";

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
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const isDisabled = disabled || loading;

  const containerStyles = [
    styles.base,
    variant === "main" && styles.main,
    variant === "secondary" && styles.secondary,
    variant === "outline" && styles.outline,
    variant === "danger" && styles.danger,
    isDisabled && styles.disabled,
    style,
    containerStyle,
  ];

  const labelStyles = [
    styles.label,
    variant === "secondary" && styles.labelSecondary,
    variant === "outline" && styles.labelOutline,
    variant === "danger" && styles.labelDanger,
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

const createStyles = (colors: any) => StyleSheet.create({
  base: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    width: "100%",
  },
  main: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: colors.text,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.background,
  },
  disabled: {
    backgroundColor: colors.foreground,
    borderColor: colors.text,
    opacity: 0.2,
  },
  label: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
  labelSecondary: {
    color: colors.text,
  },
  labelOutline: {
    color: colors.text,
  },
  labelDanger: {
    color: colors.text,
  },
});

