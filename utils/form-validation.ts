// Movi aqui la funcion para reutilizarla en otros archivos
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}