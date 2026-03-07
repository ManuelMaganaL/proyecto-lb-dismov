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
