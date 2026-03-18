import { supabase } from "@/backend/supabase/client";

export interface EncryptedClaveItem {
  id: string;
  titulo: string | null;
  dato_encriptado: string;
  created_at: string;
}

interface ActionResult {
  success: boolean;
  error: string | null;
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
export async function signup(email: string, password: string) {
  const {data, error} = await supabase.auth.signUp({email, password});

  if (error) {
    console.log("Error signup:", error);
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

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log("Error logout:", error);
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

// Guarda un dato ya cifrado en la tabla public.claves
export async function saveEncryptedDato(datoEncriptado: string, titulo?: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      success: false,
      error: "No hay sesión activa.",
    };
  }

  const { error } = await supabase.from("claves").insert({
    owner_user_id: userData.user.id,
    titulo: titulo ?? "Clave",
    dato_encriptado: datoEncriptado,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    error: null,
  };
}

export async function updateEncryptedDato(
  id: string,
  payload: { titulo?: string; dato_encriptado?: string }
): Promise<ActionResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      success: false,
      error: "No hay sesión activa.",
    };
  }

  const updates: { titulo?: string; dato_encriptado?: string } = {};

  if (typeof payload.titulo === "string") {
    updates.titulo = payload.titulo;
  }

  if (typeof payload.dato_encriptado === "string") {
    updates.dato_encriptado = payload.dato_encriptado;
  }

  const { error } = await supabase
    .from("claves")
    .update(updates)
    .eq("id", id)
    .eq("owner_user_id", userData.user.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    error: null,
  };
}

export async function deleteEncryptedDato(id: string): Promise<ActionResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      success: false,
      error: "No hay sesión activa.",
    };
  }

  const { error } = await supabase
    .from("claves")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", userData.user.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    error: null,
  };
}

export async function getEncryptedDatos() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      data: null,
      error: "No hay sesión activa.",
    };
  }

  const { data, error } = await supabase
    .from("claves")
    .select("id, titulo, dato_encriptado, created_at")
    .eq("owner_user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: (data ?? []) as EncryptedClaveItem[],
    error: null,
  };
}
