import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    "[lib/supabase-storage] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined. Avatar uploads will fail until set in .env.local."
  );
}

export const supabaseStorage = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseServiceRoleKey || "placeholder-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function uploadAvatar({
  userId,
  file,
  filename,
  contentType = "image/jpeg",
}: {
  userId: string;
  file: Buffer | ArrayBuffer | Uint8Array;
  filename: string;
  contentType?: string;
}): Promise<{ url?: string; error?: string }> {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return { error: "Supabase Storage credentials are not configured" };
    }

    const path = `${userId}/${filename}`;
    const { error: uploadError } = await supabaseStorage.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error("[lib/supabase-storage.uploadAvatar]", uploadError);
      return { error: uploadError.message };
    }

    const { data } = supabaseStorage.storage.from("avatars").getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (error) {
    console.error("[lib/supabase-storage.uploadAvatar]", error);
    return { error: "Failed to upload image to Supabase Storage" };
  }
}

export async function uploadLogbookAttachment({
  studentId,
  entryId,
  file,
  filename,
  contentType = "application/octet-stream",
}: {
  studentId: string;
  entryId: string;
  file: Buffer | ArrayBuffer | Uint8Array;
  filename: string;
  contentType?: string;
}): Promise<{ url?: string; error?: string }> {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return { error: "Supabase Storage credentials are not configured" };
    }

    const path = `${studentId}/${entryId}/${filename}`;
    const { error: uploadError } = await supabaseStorage.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error("[lib/supabase-storage.uploadLogbookAttachment]", uploadError);
      return { error: uploadError.message };
    }

    const { data } = supabaseStorage.storage.from("avatars").getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (error) {
    console.error("[lib/supabase-storage.uploadLogbookAttachment]", error);
    return { error: "Failed to upload attachment to Supabase Storage" };
  }
}

