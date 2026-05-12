export const COLORS = {
  light: {
    primary: "#0D9488",
    secondary: "#2DD4BF",
    success: "#10B981",
    danger: "#EF4444",
    text: "#0F172A",
    background: "#F8FAFC",
    foreground: "#E2E8F0",
    accent: "#64748B",
    links: "#3B82F6",
    subText: "#475569",
    surface: "#FFFFFF",
  },
  dark: {
    primary: "#14B8A6",
    secondary: "#2DD4BF",
    success: "#10B981",
    danger: "#EF4444",
    text: "#F1F5F9",
    background: "#0B1120",
    foreground: "#334155",
    accent: "#94A3B8",
    links: "#60A5FA",
    subText: "#CBD5E1",
    surface: "#1E293B",
  },
}

export type ThemeColors = typeof COLORS.light;