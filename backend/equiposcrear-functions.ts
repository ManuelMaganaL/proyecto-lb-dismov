import { supabase } from "@/backend/supabase/client";
import { allowAccess, getUserData } from "@/backend/auth-functions";
import { ROLES } from "@/constants/roles";
import type { Equipo } from "@/backend/equipos-functions";

interface CrearEquipoResult {
  success: boolean;
  data: Equipo | null;
  error: string | null;
}

export async function fetch_crearequipos(nombre: string, leader_id: string): Promise<CrearEquipoResult> {
  try {
    const user = await getUserData();
    if (!user) {
      return { success: false, data: null, error: "No hay sesión activa." };
    }

    const canAccess = await allowAccess(user.id, ROLES.admin);
    if (!canAccess) {
      return { success: false, data: null, error: "Permiso denegado para crear equipos." };
    }

    // Derivamos la organización desde el usuario logueado.
    const { data: adminUser, error: adminUserError } = await supabase
      .from("usuario")
      .select("organizacion_id")
      .eq("id", user.id)
      .single();

    if (adminUserError) {
      return { success: false, data: null, error: adminUserError.message };
    }

    const organizacion_id = adminUser?.organizacion_id;
    if (!organizacion_id) {
      return { success: false, data: null, error: "El usuario no tiene organización asignada." };
    }

    // Validamos que el leader existe y pertenece a la misma organización.
    const { data: leaderUser, error: leaderError } = await supabase
      .from("usuario")
      .select("id, rol_id, organizacion_id")
      .eq("id", leader_id)
      .single();

    if (leaderError) {
      return { success: false, data: null, error: "Líder no encontrado." };
    }

    if (leaderUser?.organizacion_id !== organizacion_id) {
      return { success: false, data: null, error: "El líder no pertenece a la misma organización." };
    }

    if (leaderUser?.rol_id === ROLES.pending) {
      return { success: false, data: null, error: "Un usuario pendiente no puede ser líder." };
    }

    const { data: created, error: insertError } = await supabase
      .from("equipo")
      .insert({
        nombre: nombre.trim(),
        leader_id: leader_id.trim(),
        organizacion_id,
      })
      .select("id, leader_id, nombre, organizacion_id, created_at, updated_at")
      .single();

    if (insertError) {
      return { success: false, data: null, error: insertError.message };
    }

    return { success: true, data: created as Equipo, error: null };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message || "Error al crear el equipo." };
  }
}

export async function fetchAvailableLeaders(): Promise<{ success: boolean; data: any[]; error: string | null }> {
  try {
    const user = await getUserData();
    if (!user) return { success: false, data: [], error: "No session" };

    const { data: adminUser } = await supabase
      .from("usuario")
      .select("organizacion_id")
      .eq("id", user.id)
      .single();

    if (!adminUser?.organizacion_id) return { success: false, data: [], error: "No org" };

    const { data, error } = await supabase
      .from("usuario")
      .select("id, nombre, correo")
      .eq("organizacion_id", adminUser.organizacion_id)
      .neq("rol_id", ROLES.pending)
      .order("nombre", { ascending: true });

    if (error) return { success: false, data: [], error: error.message };

    return { success: true, data: data || [], error: null };
  } catch (e: any) {
    return { success: false, data: [], error: e?.message || "Error" };
  }
}
