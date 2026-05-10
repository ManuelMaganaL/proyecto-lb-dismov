import { supabase } from "./supabase/client";

export interface Equipo {
  id: string;
  leader_id: string;
  nombre: string;
  organizacion_id: string;
  created_at: string;
  updated_at: string;
}

export interface Teamate {
  id: string;
  nombre: string;
  correo: string;
}

export interface MiembroEquipo {
  id: string;
  nombre: string;
  foto_url: string | null;
  correo: string;
}

export interface EquipoData {
  id: string;
  leader: Teamate;
  miembros: Teamate[];
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

/**
 * Obtiene los equipos a los que pertenece el usuario (via equipo_usuario).
 */
export async function fetchMisEquipos(userId: string) {
  const { data: rows, error: rowsError } = await supabase
    .from("equipo_usuario")
    .select("equipo_id")
    .eq("usuario_id", userId);

  if (rowsError) {
    console.error("Error fetching mis equipos (IDs):", rowsError);
    return { data: [] as Equipo[], error: rowsError.message };
  }

  const ids = (rows ?? []).map((r: any) => r.equipo_id);
  if (ids.length === 0) return { data: [] as Equipo[], error: null };

  const { data, error } = await supabase
    .from("equipo")
    .select("id, nombre, leader_id, organizacion_id, created_at, updated_at")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching mis equipos:", error);
    return { data: [] as Equipo[], error: error.message };
  }

  return { data: (data ?? []) as Equipo[], error: null };
}

/**
 * Obtiene los miembros de un equipo específico.
 */
export async function fetchMiembrosEquipo(equipoId: string) {
  const { data: rows, error: rowsError } = await supabase
    .from("equipo_usuario")
    .select("usuario_id")
    .eq("equipo_id", equipoId);

  if (rowsError) {
    console.error("Error fetching miembros (IDs):", rowsError);
    return { data: [] as MiembroEquipo[], error: rowsError.message };
  }

  const ids = (rows ?? []).map((r: any) => r.usuario_id);
  if (ids.length === 0) return { data: [] as MiembroEquipo[], error: null };

  const { data, error } = await supabase
    .from("usuario")
    .select("id, nombre, foto_url, correo")
    .in("id", ids)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching miembros:", error);
    return { data: [] as MiembroEquipo[], error: error.message };
  }

  return { data: (data ?? []) as MiembroEquipo[], error: null };
}

/**
 * Obtiene los usuarios de la organización que NO están en el equipo dado.
 */
export async function fetchUsuariosOrganizacion(organizacionId: string, equipoId: string) {
  const { data: miembrosData, error: miembrosError } = await supabase
    .from("equipo_usuario")
    .select("usuario_id")
    .eq("equipo_id", equipoId);

  if (miembrosError) {
    console.error("Error fetching miembros del equipo:", miembrosError);
    return {
      data: [] as MiembroEquipo[],
      error: miembrosError.message,
    };
  }

  const idsEnEquipo = (miembrosData ?? []).map((r: any) => r.usuario_id);

  let query = supabase
    .from("usuario")
    .select("id, nombre, foto_url, correo")
    .eq("organizacion_id", organizacionId)
    .order("nombre", { ascending: true });

  if (idsEnEquipo.length > 0) {
    const formattedIds = idsEnEquipo.map((id: string) => `"${id}"`).join(",");
    query = query.not("id", "in", `(${formattedIds})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching usuarios de la organización:", error);
    return {
      data: [] as MiembroEquipo[],
      error: error.message,
    };
  }

  return {
    data: (data ?? []) as MiembroEquipo[],
    error: null,
  };
}

/**
 * Agrega un miembro a un equipo.
 */
export async function addMiembroEquipo(equipoId: string, usuarioId: string) {
  const { data, error } = await supabase
    .from("equipo_usuario")
    .insert({ equipo_id: equipoId, usuario_id: usuarioId })
    .select();

  if (error) {
    console.error("Error agregando miembro:", error);
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, error: "La base de datos no registró el cambio (asegúrate de haber creado la política RLS de INSERT)." };
  }

  return { success: true, error: null };
}

/**
 * Elimina un miembro de un equipo.
 */
export async function removeMiembroEquipo(equipoId: string, usuarioId: string) {
  const { error } = await supabase
    .from("equipo_usuario")
    .delete()
    .eq("equipo_id", equipoId)
    .eq("usuario_id", usuarioId);

  if (error) {
    console.error("Error eliminando miembro:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export interface UsuarioConEquipos extends MiembroEquipo {
  equipos: string[];
}

/**
  equipo por ID.
 */
export async function fetchEquipoById(id: string) {
  const { data, error } = await supabase
    .from("equipo")
    .select("id, nombre, leader_id, organizacion_id, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching equipo:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Equipo, error: null };
}


export async function fetchUsuariosOrganizacionConEquipos(organizacionId: string, equipoId: string) {
  // 1. Obtener IDs de usuarios en el equipo actual para excluirlos
  const { data: miembrosData, error: miembrosError } = await supabase
    .from("equipo_usuario")
    .select("usuario_id")
    .eq("equipo_id", equipoId);

  if (miembrosError) {
    console.error("Error fetching miembros del equipo:", miembrosError);
    return { data: [] as UsuarioConEquipos[], error: miembrosError.message };
  }

  const idsEnEquipo = (miembrosData ?? []).map((r: any) => r.usuario_id);

  let query = supabase
    .from("usuario")
    .select(`
      id, nombre, foto_url, correo,
      equipo_usuario (
        equipo!equipo_usuario_equipo_id_fkey (nombre)
      )
    `)
    .eq("organizacion_id", organizacionId)
    .order("nombre", { ascending: true });

  if (idsEnEquipo.length > 0) {
    const formattedIds = idsEnEquipo.map((id: string) => `"${id}"`).join(",");
    query = query.not("id", "in", `(${formattedIds})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching usuarios con equipos:", error);
    return { data: [] as UsuarioConEquipos[], error: error.message };
  }

  const usuariosConEquipos: UsuarioConEquipos[] = (data ?? []).map((user: any) => {
    const equiposNombres = user.equipo_usuario
      ?.filter((eu: any) => eu.equipo && eu.equipo.nombre)
      ?.map((eu: any) => eu.equipo.nombre) || [];

    return {
      id: user.id,
      nombre: user.nombre,
      foto_url: user.foto_url,
      correo: user.correo,
      equipos: equiposNombres
    };
  });

  return { data: usuariosConEquipos, error: null };
}
