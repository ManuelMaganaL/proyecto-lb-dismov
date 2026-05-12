export const ROUTES = {
  AUTH_LOGIN: "/auth/login" as const,
  AUTH_SIGNUP: "/auth/signup" as const,
  AUTH_USUARIOS_LINK: "/auth/usuarios-link" as const,
  USERS_TABS: "/users/(tabs)" as const,
  ADMIN_EQUIPOS: "/admin/equipos" as const,
  ADMIN_MIS_EQUIPOS: "/admin/misequipos" as const,
  ADMIN_ORGANIZACION: "/admin/organizacion" as const,
  ERROR_NO_ADMIN: "/error/no-admin" as const,
  ERROR_NO_USUARIO: "/error/no-usuario" as const,
} as const;
