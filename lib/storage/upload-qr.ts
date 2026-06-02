import "server-only";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadPaymentQrImage(
  userId: string,
  folder: string,
  file: File | null
): Promise<{ url?: string; error?: string }> {
  if (!file || file.size === 0) {
    return {};
  }

  if (file.size > MAX_BYTES) {
    return { error: "Image must be 2MB or smaller." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Use JPEG, PNG, WebP, or GIF." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  // First path segment must be user id (matches storage RLS policy)
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("payment-qr").upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    return { error: error.message };
  }

  const { data } = supabase.storage.from("payment-qr").getPublicUrl(path);
  return { url: data.publicUrl };
}
