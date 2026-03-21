export const ROLES = {
  admin: 1,      // Tienen permisos de crear organizaciones, aceptar usuarios en la org, y ver todos los equipos y usuarios.
  teamLeader: 2, // Tienen permisos de crear equipos.
  user: 3,       // Con cuenta y que pertenecen a una organizacion.
  pending: 4,    // Con cuenta pero que aun no son aceptados en la organizacion que pusieron en el registro.
}