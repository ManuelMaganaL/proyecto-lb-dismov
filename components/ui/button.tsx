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
import { ThemeColors } from "@/constants/colors";

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
    isDisabled && styles.labelSecondary,
    textStyle,
  ];

  return (
    <TouchableOpacity
      disabled={isDisabled}
      activeOpacity={0.8}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    width: "100%",
  },
  main: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.foreground,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: colors.foreground,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  disabled: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  } as TextStyle,
  labelSecondary: {
    color: colors.text,
  },
  labelOutline: {
    color: colors.text,
  },
  labelDanger: {
    color: colors.background,
  },
});

