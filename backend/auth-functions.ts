import { supabase } from "@/backend/supabase/client";


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
export async function signup(name: string, email: string, password: string, organization: string,) {
  const {data: signupData, error: signupError} = await supabase.auth.signUp({email, password});

  if (signupError) {
    console.error("Error signup:", signupError);
    return {
      data: null,
      error: signupError.message,
    }
  }

  const {data: userData, error: userError} = await supabase.from("users").insert({
    id: signupData.user?.id,
    nombre: name,
    foto_url: null,
    correo: email,
    rol: 3, // Rol de usuario normal, cambiar a 4 cuando se implemente lo de las invitaciones para poder acceder a la organizacion 
  })

  if (userError) {
    console.error("Error creating user in database:", userError);
    return {
      data: null,
      error: userError.message,
    }
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