"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase";

export async function upsertPost(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;

  const title = (formData.get("title") as string).trim();
  const slug = (formData.get("slug") as string).trim().toLowerCase().replace(/\s+/g, "-");
  const category = (formData.get("category") as string).trim();
  const excerpt = (formData.get("excerpt") as string).trim();
  const content = (formData.get("content") as string).trim();
  const color = (formData.get("color") as string).trim() || "bg-secondary";
  const read_time = (formData.get("read_time") as string).trim();
  const is_featured = formData.get("is_featured") === "true";
  const is_published = formData.get("is_published") === "true";
  const published_at = is_published ? new Date().toISOString() : null;

  const file = formData.get("cover_image") as File | null;
  let cover_image_url: string | undefined;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const path = `journal/${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("images").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      cover_image_url = data.publicUrl;
    }
  }

  const payload: Record<string, unknown> = {
    slug, title, category, excerpt, content, color, read_time,
    is_featured, is_published, published_at, updated_at: new Date().toISOString(),
  };
  if (cover_image_url) payload.cover_image_url = cover_image_url;

  if (id) {
    await supabase.from("journal_posts").update(payload).eq("id", id);
  } else {
    await supabase.from("journal_posts").insert(payload);
  }

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
}

export async function deletePost(formData: FormData) {
  const supabase = createServiceClient();
  await supabase.from("journal_posts").delete().eq("id", formData.get("id") as string);
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
}
