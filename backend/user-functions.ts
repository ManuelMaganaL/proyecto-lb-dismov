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
