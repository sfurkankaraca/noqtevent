"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase";

export async function upsertConcept(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;

  const slug = (formData.get("slug") as string).trim().toLowerCase().replace(/\s+/g, "-");
  const name = (formData.get("name") as string).trim();
  const emoji = (formData.get("emoji") as string).trim();
  const category = formData.get("category") as string;
  const description = (formData.get("description") as string).trim();
  const atmosphere = (formData.get("atmosphere") as string)
    .split(",").map((s) => s.trim()).filter(Boolean);
  const musical_direction = (formData.get("musical_direction") as string)
    .split(",").map((s) => s.trim()).filter(Boolean);
  const color = (formData.get("color") as string).trim() || "bg-secondary";
  const is_dark = formData.get("is_dark") === "true";
  const is_signature = formData.get("is_signature") === "true";
  const energy_level = parseInt(formData.get("energy_level") as string) || 5;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;
  const is_active = formData.get("is_active") !== "false";

  // Optional cover image upload
  const file = formData.get("cover_image") as File | null;
  let cover_image_url: string | undefined;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const path = `concepts/${slug}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("images")
      .upload(path, file, { upsert: true });
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
      cover_image_url = urlData.publicUrl;
    }
  }

  const payload: Record<string, unknown> = {
    slug, name, emoji, category, description,
    atmosphere, musical_direction, color,
    is_dark, is_signature, energy_level, sort_order, is_active,
  };
  if (cover_image_url) payload.cover_image_url = cover_image_url;

  if (id) {
    await supabase.from("concepts").update(payload).eq("id", id);
  } else {
    await supabase.from("concepts").insert(payload);
  }

  revalidatePath("/admin/konseptler");
  revalidatePath("/konseptler");
}

export async function deleteConcept(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string;
  await supabase.from("concepts").delete().eq("id", id);
  revalidatePath("/admin/konseptler");
  revalidatePath("/konseptler");
}
