import { supabase } from "./supabase/client";
import { getUserData } from "./auth-functions";


export interface EncryptedClaveItem {
  id: string;
  titulo: string | null;
  dato_encriptado: string;
  emisor_id?: string;
  receptor_id?: string;
  emisor_nombre?: string;
  emisor_correo?: string;
  receptor_nombre?: string;
  receptor_correo?: string;
  max_vistas?: number;
  vistas_usadas?: number;
  fecha_caducidad?: string | null;
  created_at: string;
}

export interface UserTargetOption {
  id: string;
  nombre: string;
  correo?: string;
}

interface ActionResult {
  success: boolean;
  error: string | null;
}


// Guarda un dato ya cifrado en la tabla public.claves
export async function saveEncryptedDato(
  datoEncriptado: string,
  titulo?: string,
  receptorId?: string,
  maxVistas?: number,
  fechaCaducidad?: string | null
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      success: false,
      error: "No hay sesión activa.",
    };
  }

  const normalizedReceptorId = receptorId?.trim() || userData.user.id;
  const normalizedMaxVistas = typeof maxVistas === "number" && maxVistas > 0 ? maxVistas : 1;

  const { error } = await supabase.from("claves").insert({
    emisor_id: userData.user.id,
    receptor_id: normalizedReceptorId,
    clave: titulo ?? "Clave",
    valor_encriptado: datoEncriptado,
    max_vistas: normalizedMaxVistas,
    fecha_caducidad: fechaCaducidad ?? null,
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

  const updates: { clave?: string; valor_encriptado?: string } = {};

  if (typeof payload.titulo === "string") {
    updates.clave = payload.titulo;
  }

  if (typeof payload.dato_encriptado === "string") {
    updates.valor_encriptado = payload.dato_encriptado;
  }

  const { error } = await supabase
    .from("claves")
    .update(updates)
    .eq("id", id)
    .eq("emisor_id", userData.user.id);

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
    .eq("emisor_id", userData.user.id);

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
  const user = await getUserData();

  if (!user) {
    return {
      data: null,
      error: "No hay sesión activa.",
    };
  }

  const { data, error } = await supabase
    .from("claves")
    .select("id, titulo:clave, dato_encriptado:valor_encriptado, emisor_id, receptor_id, max_vistas, vistas_usadas, fecha_caducidad, created_at")
    .or(`emisor_id.eq.${user.id},receptor_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  const rows = (data ?? []) as EncryptedClaveItem[];
  const userIds = Array.from(
    new Set(rows.flatMap((item) => [item.emisor_id, item.receptor_id]).filter((id): id is string => Boolean(id)))
  );

  if (userIds.length === 0) {
    return {
      data: rows,
      error: null,
    };
  }

  const { data: usersData, error: usersError } = await supabase
    .from("usuario")
    .select("id, nombre, correo")
    .in("id", userIds);

  if (usersError) {
    return {
      data: rows,
      error: null,
    };
  }

  const usersById = new Map(
    (usersData ?? []).map((user) => [
      user.id as string,
      {
        nombre: ((user.nombre as string | null) ?? "").trim() || "Usuario",
        correo: ((user.correo as string | null) ?? "").trim(),
      },
    ])
  );

  return {
    data: rows.map((item) => ({
      ...item,
      emisor_nombre: item.emisor_id ? usersById.get(item.emisor_id)?.nombre || "Usuario" : "Usuario",
      emisor_correo: item.emisor_id ? usersById.get(item.emisor_id)?.correo || "" : "",
      receptor_nombre: item.receptor_id ? usersById.get(item.receptor_id)?.nombre || "Usuario" : "Usuario",
      receptor_correo: item.receptor_id ? usersById.get(item.receptor_id)?.correo || "" : "",
    })) as EncryptedClaveItem[],
    error: null,
  };
}

export async function consumeEncryptedDato(claveId: string) {
  const { data, error } = await supabase.rpc("consume_clave", {
    p_clave_id: claveId,
  });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      data: null,
      error: "No se pudo consumir la clave.",
    };
  }

  return {
    data: {
      id: row.id as string,
      titulo: (row.clave as string) ?? "Clave",
      dato_encriptado: row.valor_encriptado as string,
      emisor_id: row.emisor_id as string,
      receptor_id: row.receptor_id as string,
      max_vistas: row.max_vistas as number,
      vistas_usadas: row.vistas_usadas as number,
      fecha_caducidad: (row.fecha_caducidad as string | null) ?? null,
      created_at: row.created_at as string,
    } as EncryptedClaveItem,
    error: null,
  };
}

export async function getUserTargetOptions() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      data: null,
      error: "No hay sesión activa.",
    };
  }

  const { data, error } = await supabase
    .from("usuario")
    .select("id, nombre, correo")
    .neq("id", userData.user.id)
    .order("nombre", { ascending: true });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  const options: UserTargetOption[] = (data ?? []).map((row) => ({
    id: row.id as string,
    nombre: ((row.nombre as string) || "Usuario").trim() || "Usuario",
    correo: ((row.correo as string | null) ?? "").trim() || undefined,
  }));

  // Fallback estable: devolvemos lista base de usuarios visibles por RLS de `usuario`.
  // El filtrado por organización/equipo se puede reactivar cuando se corrijan policies recursivas.
  return {
    data: options,
    error: null,
  };
}
