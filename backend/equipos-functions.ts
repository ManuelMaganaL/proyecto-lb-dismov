import { supabase } from "./supabase/client";

export interface Equipo {
  id: string;
  leader_id: string;
  nombre: string;
  organizacion_id: string;
  created_at: string;
  updated_at: string;
}

export async function fetchEquipos() {
  const { data, error } = await supabase
    .from("equipo")
    .select("id, leader_id, nombre, organizacion_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching equipos:", error);
    return {
      data: [] as Equipo[],
      error: error.message,
    };
  }

  return {
    data: (data ?? []) as Equipo[],
    error: null,
  };
}
