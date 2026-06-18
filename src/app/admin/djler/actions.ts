"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function upsertDj(formData: FormData) {
  const supabase = createServiceClient();

  const id = formData.get("id") as string | null;
  const photoFile = formData.get("photo_file") as File | null;

  let photo_url: string | null = (formData.get("existing_photo_url") as string) || null;

  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split(".").pop();
    const path = `dj/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await photoFile.arrayBuffer());
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(path, buffer, { contentType: photoFile.type, upsert: false });

    if (uploadError) throw new Error("Fotoğraf yükleme hatası: " + uploadError.message);

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(uploadData.path);
    photo_url = urlData.publicUrl;
  }

  const concept_tags = (formData.get("concept_tags") as string)
    .split(",").map((t) => t.trim()).filter(Boolean);

  const busy_dates = (formData.get("busy_dates") as string)
    .split(",").map((d) => d.trim()).filter(Boolean);

  const payload = {
    name: formData.get("name") as string,
    bio: (formData.get("bio") as string) || null,
    soundcloud_url: (formData.get("soundcloud_url") as string) || null,
    mixcloud_url: (formData.get("mixcloud_url") as string) || null,
    youtube_url: (formData.get("youtube_url") as string) || null,
    concept_tags,
    busy_dates,
    is_active: formData.get("is_active") === "true",
    ...(photo_url ? { photo_url } : {}),
  };

  if (id) {
    await supabase.from("dj_profiles").update(payload).eq("id", id);
  } else {
    // clerk_id is optional for admin-created profiles; use a placeholder
    await supabase.from("dj_profiles").insert({ ...payload, clerk_id: `admin-${Date.now()}` });
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
