import { supabase } from "@/backend/supabase/client";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { getUserData } from "@/backend/auth-functions";

export interface ProfileData {
  email: string;
  fullName: string;
  avatarUrl: string;
}

interface ActionResult {
  success: boolean;
  error: string | null;
}

export interface OrganizacionUsuario {
  id: string;
  nombre: string;
  correo: string;
  rol_id?: number;
  equipo_nombre?: string;
  puede_compartir?: boolean;
}

// --- FUNCIONES DE PERFIL ---
export async function getProfileData() {
  const user = await getUserData();
  if (!user) return { data: null, error: "No hay sesión activa." };

  // Nombre desde user_metadata (Auth)
  const metaName = ((user.user_metadata?.full_name as string) ?? "").trim();

  // Fallback: leer nombre desde la tabla usuario
  let dbName = "";
  if (!metaName) {
    const { data: row } = await supabase
      .from("usuario")
      .select("nombre")
      .eq("id", user.id)
      .single();
    dbName = ((row?.nombre as string) ?? "").trim();
  }

  return {
    data: {
      email: user.email ?? "",
      fullName: metaName || dbName,
      avatarUrl: (user.user_metadata?.avatar_url as string) ?? "",
    } as ProfileData,
    error: null,
  };
}

export async function uploadProfileAvatar(payload: any) {
  const user = await getUserData();
  if (!user) return { publicUrl: null, error: "No hay sesión activa." };
  try {
    const fileBase64 = await FileSystem.readAsStringAsync(payload.fileUri, { encoding: "base64" as never });
    const fileBuffer = decode(fileBase64);
    const bucket = process.env.EXPO_PUBLIC_SUPABASE_AVATARS_BUCKET || "avatars";
    const path = `${user.id}/avatar-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, fileBuffer, { contentType: "image/jpeg", upsert: true });
    if (uploadError) return { publicUrl: null, error: uploadError.message };
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { publicUrl: data.publicUrl, error: null };
  } catch (error) {
    return { publicUrl: null, error: "Error al subir la imagen." };
  }
}

export async function updateProfileData(payload: any) {
  const user = await getUserData();
  if (!user) return { success: false, error: "No hay sesión activa." };
  const updatePayload: any = { data: {} };
  if (payload.fullName) updatePayload.data.full_name = payload.fullName.trim();
  if (payload.avatarUrl) updatePayload.data.avatar_url = payload.avatarUrl.trim();
  const { error } = await supabase.auth.updateUser(updatePayload);
  return { success: !error, error: error?.message || null };
}

// --- FUNCIONES DE ADMINISTRACIÓN DE ORGANIZACIÓN ---

export async function getOrganizationTeams() {
  const user = await getUserData();
  if (!user) return { data: [], error: "No hay sesión activa." };
  const { data: admin } = await supabase.from('usuario').select('organizacion_id').eq('id', user.id).single();
  if (!admin?.organizacion_id) return { data: [], error: null };
  const { data, error } = await supabase.from('equipo').select('id, nombre').eq('organizacion_id', admin.organizacion_id);
  return { data: data || [], error: error?.message || null };
}

export async function getOrganizationMembers() {
  const user = await getUserData();
  if (!user) return { data: null, error: "No hay sesión activa." };

  const { data: admin } = await supabase.from('usuario').select('organizacion_id').eq('id', user.id).single();
  if (!admin?.organizacion_id) return { data: [], error: null };

  const { data: usuarios, error: userError } = await supabase
    .from('usuario')
    .select('id, nombre, correo, rol_id, puede_compartir')
    .eq('organizacion_id', admin.organizacion_id)
    .in('rol_id', [1, 2, 3]);

  if (userError) return { data: null, error: userError.message };

  const { data: asignaciones } = await supabase
    .from('equipo_usuario')
    .select('usuario_id, equipo(nombre)');

  const formattedData = usuarios.map(u => {
    const asignacion = asignaciones?.find(a => a.usuario_id === u.id);
    return {
      id: u.id,
      nombre: u.nombre,
      correo: u.correo,
      rol_id: u.rol_id,
      puede_compartir: u.puede_compartir,
      equipo_nombre: (asignacion?.equipo as any)?.nombre || 'Sin equipo'
    };
  });

  return { data: formattedData, error: null };
}

export async function getPendingInvitations() {
  const user = await getUserData();
  if (!user) return { data: null, error: "No hay sesión activa." };
  const { data: admin } = await supabase.from('usuario').select('organizacion_id').eq('id', user.id).single();
  if (!admin?.organizacion_id) return { data: [], error: null };

  const { data, error } = await supabase
    .from('usuario')
    .select('id, nombre, correo')
    .eq('organizacion_id', admin.organizacion_id)
    .eq('rol_id', 4);

  return { data: data || [], error: error?.message || null };
}

export async function acceptUserInvitation(userId: string): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('usuario')
    .update({ rol_id: 3 })
    .eq('id', userId)
    .select();

  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0) return { success: false, error: "Permiso denegado (RLS)." };

  return { success: true, error: null };
}

/**
 * Desvincula al usuario de la organización en lugar de borrarlo.
 */
export async function removeUser(userId: string): Promise<ActionResult> {
  // 1. Eliminar de equipo_usuario para que no pertenezca a ningún equipo
  await supabase.from('equipo_usuario').delete().eq('usuario_id', userId);

  // 2. Desvincular de la organización y devolver a rol Pendiente (4)
  const { data, error } = await supabase
    .from('usuario')
    .update({
      organizacion_id: null,
      rol_id: 4
    })
    .eq('id', userId)
    .select();

  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0) return { success: false, error: "No se pudo desvincular al usuario." };

  return { success: true, error: null };
}

export async function toggleSharePermission(userId: string, canShare: boolean): Promise<ActionResult> {
  const { error } = await supabase.from('usuario').update({ puede_compartir: canShare }).eq('id', userId);
  return { success: !error, error: error?.message || null };
}
