import { supabase } from "@/backend/supabase/client";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

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

export interface ProfileData {
  email: string;
  fullName: string;
  avatarUrl: string;
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

interface ProfileUpdatePayload {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  password?: string;
}

interface AvatarUploadPayload {
  fileUri: string;
  fileName?: string;
  mimeType?: string;
}

interface AvatarUploadResult {
  publicUrl: string | null;
  error: string | null;
}

function inferImageContentType(fileName?: string, mimeType?: string): string {
  if (mimeType?.startsWith("image/")) {
    return mimeType;
  }

  const normalizedName = (fileName ?? "").toLowerCase();

  if (normalizedName.endsWith(".png")) return "image/png";
  if (normalizedName.endsWith(".webp")) return "image/webp";
  if (normalizedName.endsWith(".heic")) return "image/heic";
  if (normalizedName.endsWith(".heif")) return "image/heif";

  return "image/jpeg";
}

function inferFileExtension(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic") return "heic";
  if (contentType === "image/heif") return "heif";
  return "jpg";
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

export async function getProfileData() {
  const user = await getUserData();

  if (!user) {
    return {
      data: null,
      error: "No hay sesión activa.",
    };
  }

  return {
    data: {
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string) ?? "",
      avatarUrl: (user.user_metadata?.avatar_url as string) ?? "",
    } as ProfileData,
    error: null,
  };
}

export async function uploadProfileAvatar(payload: AvatarUploadPayload): Promise<AvatarUploadResult> {
  const user = await getUserData();

  if (!user) {
    return {
      publicUrl: null,
      error: "No hay sesión activa.",
    };
  }

  try {
    const fileBase64 = await FileSystem.readAsStringAsync(payload.fileUri, {
      // Some Expo runtimes do not expose EncodingType consistently.
      encoding: "base64" as never,
    });
    const fileBuffer = decode(fileBase64);
    const contentType = inferImageContentType(payload.fileName, payload.mimeType);
    const extension = inferFileExtension(contentType);
    const bucket = process.env.EXPO_PUBLIC_SUPABASE_AVATARS_BUCKET || "avatars";
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return {
        publicUrl: null,
        error: uploadError.message,
      };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    if (!data.publicUrl) {
      return {
        publicUrl: null,
        error: "No se pudo generar la URL pública del avatar.",
      };
    }

    return {
      publicUrl: data.publicUrl,
      error: null,
    };
  } catch (error) {
    const detailedMessage = error instanceof Error ? error.message : "Error desconocido al leer el archivo.";
    return {
      publicUrl: null,
      error: `Ocurrió un error al subir la imagen de perfil: ${detailedMessage}`,
    };
  }
}

export async function updateProfileData(payload: ProfileUpdatePayload): Promise<ActionResult> {
  const user = await getUserData();

  if (!user) {
    return {
      success: false,
      error: "No hay sesión activa.",
    };
  }

  const updatePayload: {
    email?: string;
    password?: string;
    data?: {
      full_name?: string;
      avatar_url?: string;
    };
  } = {};

  if (typeof payload.email === "string" && payload.email.trim() && payload.email.trim() !== user.email) {
    updatePayload.email = payload.email.trim();
  }

  if (typeof payload.password === "string" && payload.password.trim()) {
    updatePayload.password = payload.password;
  }

  const metadataUpdates: { full_name?: string; avatar_url?: string } = {};

  if (typeof payload.fullName === "string") {
    metadataUpdates.full_name = payload.fullName.trim();
  }

  if (typeof payload.avatarUrl === "string") {
    metadataUpdates.avatar_url = payload.avatarUrl.trim();
  }

  if (Object.keys(metadataUpdates).length > 0) {
    updatePayload.data = metadataUpdates;
  }

  if (Object.keys(updatePayload).length === 0) {
    return {
      success: false,
      error: "No hay cambios para guardar.",
    };
  }

  const { error } = await supabase.auth.updateUser(updatePayload);

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
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      data: null,
      error: "No hay sesión activa.",
    };
  }

  const { data, error } = await supabase
    .from("claves")
    .select("id, titulo:clave, dato_encriptado:valor_encriptado, emisor_id, receptor_id, max_vistas, vistas_usadas, fecha_caducidad, created_at")
    .or(`emisor_id.eq.${userData.user.id},receptor_id.eq.${userData.user.id}`)
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
