"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FocalPoint } from "@/components/admin/FocalPointPicker";

export async function upsertDj(formData: FormData) {
  const supabase = createServiceClient();

  const id = formData.get("id") as string | null;

  // Existing photos (already stored URLs)
  const existingPhotos: string[] = JSON.parse(
    (formData.get("existing_photos") as string) || "[]"
  );

  // Upload new photo files
  const photoFiles = formData.getAll("photo_files") as File[];
  const newUrls: string[] = [];
  for (const file of photoFiles) {
    if (!file || file.size === 0) continue;
    const ext = file.name.split(".").pop();
    const path = `dj/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data: up, error } = await supabase.storage
      .from("images")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) throw new Error("Fotoğraf yükleme hatası: " + error.message);
    newUrls.push(supabase.storage.from("images").getPublicUrl(up.path).data.publicUrl);
  }

  // Reconstruct ordered photo list using photo_order
  const order: string[] = JSON.parse((formData.get("photo_order") as string) || "[]");
  const newUrlsByIndex: Record<string, string> = {};
  let newIdx = 0;
  for (const file of photoFiles) {
    if (!file || file.size === 0) continue;
    // find its order key
    const key = order.find((k) => k.startsWith("new:") && parseInt(k.split(":")[1]) === newIdx + existingPhotos.length);
    if (key) newUrlsByIndex[key] = newUrls[newIdx];
    newIdx++;
  }

  const photos: string[] = order.map((key) => {
    if (key.startsWith("new:")) {
      // map by position among new files
      const pos = parseInt(key.split(":")[1]);
      // pos is the index in the full photos array; new files start after existing
      return newUrls[pos - existingPhotos.length] ?? "";
    }
    return key;
  }).filter(Boolean);

  // Remap focal points: replace "new:N" keys with actual URLs
  const fpRaw: Record<string, FocalPoint> = JSON.parse(
    (formData.get("focal_points_json") as string) || "{}"
  );
  const focalPoints: Record<string, FocalPoint> = {};
  for (const [key, fp] of Object.entries(fpRaw)) {
    if (key.startsWith("new:")) {
      const pos = parseInt(key.split(":")[1]);
      const url = newUrls[pos - existingPhotos.length];
      if (url) focalPoints[url] = fp;
    } else {
      focalPoints[key] = fp;
    }
  }

  const concept_tags = (formData.get("concept_tags") as string)
    .split(",").map((t) => t.trim()).filter(Boolean);
  const busy_dates = (formData.get("busy_dates") as string)
    .split(",").map((d) => d.trim()).filter(Boolean);

  const photo_url = photos[0] ?? null;

  const payload = {
    name: formData.get("name") as string,
    bio: (formData.get("bio") as string) || null,
    soundcloud_url: (formData.get("soundcloud_url") as string) || null,
    mixcloud_url: (formData.get("mixcloud_url") as string) || null,
    youtube_url: (formData.get("youtube_url") as string) || null,
    concept_tags,
    busy_dates,
    is_active: formData.get("is_active") === "true",
    photos,
    focal_points: focalPoints,
    ...(photo_url !== undefined ? { photo_url } : {}),
  };

  if (id) {
    const { error: updateError } = await supabase.from("dj_profiles").update(payload).eq("id", id);
    if (updateError) {
      // photos/focal_points columns may not exist yet — retry without them
      if (updateError.message.includes("photos") || updateError.message.includes("focal_points")) {
        const { photos: _p, focal_points: _fp, ...safePayload } = payload;
        const { error: retryError } = await supabase.from("dj_profiles").update(safePayload).eq("id", id);
        if (retryError) throw new Error(retryError.message);
      } else {
        throw new Error(updateError.message);
      }
    }
  } else {
    const { error: insertError } = await supabase.from("dj_profiles").insert({ ...payload, clerk_id: `admin-${Date.now()}` });
    if (insertError) {
      if (insertError.message.includes("photos") || insertError.message.includes("focal_points")) {
        const { photos: _p, focal_points: _fp, ...safePayload } = payload;
        const { error: retryError } = await supabase.from("dj_profiles").insert({ ...safePayload, clerk_id: `admin-${Date.now()}` });
        if (retryError) throw new Error(retryError.message);
      } else {
        throw new Error(insertError.message);
      }
    }
  }

  revalidatePath("/admin/djler");
  redirect("/admin/djler");
}

export async function deleteDj(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = createServiceClient();
  await supabase.from("dj_profiles").delete().eq("id", id);
  revalidatePath("/admin/djler");
}
