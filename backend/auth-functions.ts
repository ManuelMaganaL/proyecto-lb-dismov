import { supabase } from "@/backend/supabase/client";

export interface Organizacion {
  id: string;
  nombre: string;
}

// Obtiene la lista de organizaciones para el registro
export async function fetchOrganizaciones() {
  const { data, error } = await supabase
    .from("organizacion")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching organizaciones:", error);
    return { data: [] as Organizacion[], error: error.message };
  }

  return { data: (data ?? []) as Organizacion[], error: null };
}

// Obtiene informacion del usuario
export async function getUserData() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.log("Error fetching user:", error);
    return null;
  }

  return data.user;
}

// Function to login the user
export async function login(email: string, password: string) {
  const {data, error} = await supabase.auth.signInWithPassword({email, password});

  if (error) {
    console.log("Error login:", error);
    return {
      data: null,
      error: error.message,
    }
  }

  return {
    data,
    error: null,
  };
}

// Function to create a new user
export async function signup(name: string, email: string, password: string, orgId: string) {

  // Pasar todos los datos en metadata para que el trigger los lea
  const {data: signupData, error: signupError} = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        rol_id: 4,
        organizacion_id: orgId,
        correo: email,
      },
    },
  });

  if (signupError) {
    console.error("Error signup:", signupError);
    return {
      data: null,
      error: signupError.message,
    }
  }

  // Supabase retorna un user sin identities si el correo ya está registrado
  if (signupData.user && signupData.user.identities?.length === 0) {
    return {
      data: null,
      error: "Este correo ya está registrado. Intenta iniciar sesión.",
    }
  }

  // Upsert como respaldo por si el trigger no llena todos los campos
  const {data: userData, error: userError} = await supabase.from("usuario").upsert({
    id: signupData.user?.id,
    nombre: name,
    foto_url: null,
    correo: email,
    rol_id: 4,
    organizacion_id: orgId,
  }, { onConflict: "id" })

  if (userError) {
    console.error("Error creating user in database:", userError);
    // No retornamos error aquí porque el usuario ya se creó en auth
    // El trigger pudo haber creado la fila parcialmente
  }

  return {
    data: userData,
    error: null,
  };
}

// Funcion para cerrar sesion
export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error logout:", error);
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    error: null,
  };
}

// Funcion para permitir accesos
export async function allowAccess(userId: string, minRole: number): Promise<boolean> {
  const { data, error } = await supabase.from("usuario").select("*").eq("id", userId).single();

  if (error) {
    console.error("Error fetching user role:", error);
    return false;
  }

  // Si no tiene rol asignado, no tiene acceso
  if (data.rol_id == null) {
    return false;
  }

  return data.rol_id <= minRole;
}