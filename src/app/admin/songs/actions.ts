"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteSong(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const supabase = createServiceClient();
  await supabase.from("songs").delete().eq("id", id);
  revalidatePath("/admin/songs");
}

export async function upsertSong(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();

  const id = formData.get("id") as string | null;
  const audioFile = formData.get("audio_file") as File | null;

  let audio_file_url: string | null = null;

  // Upload audio file to Supabase Storage if provided
  if (audioFile && audioFile.size > 0) {
    const ext = audioFile.name.split(".").pop();
    const path = `songs/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio")
      .upload(path, audioFile, { contentType: audioFile.type, upsert: true });

    if (uploadError) throw new Error("Ses yükleme hatası: " + uploadError.message);

    const { data: urlData } = supabase.storage.from("audio").getPublicUrl(uploadData.path);
    audio_file_url = urlData.publicUrl;
  }

  const payload = {
    title: formData.get("title") as string,
    artist: formData.get("artist") as string,
    event_moment: formData.get("event_moment") as string,
    category: formData.get("category") as string,
    language: formData.get("language") as string,
    energy: formData.get("energy") as string,
    mood_tags: (formData.get("mood_tags") as string)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    spotify_url: (formData.get("spotify_url") as string) || null,
    youtube_url: (formData.get("youtube_url") as string) || null,
    is_active: true,
    ...(audio_file_url ? { audio_file_url } : {}),
  };

  if (id) {
    await supabase.from("songs").update(payload).eq("id", id);
  } else {
    await supabase.from("songs").insert(payload);
  }

  revalidatePath("/admin/songs");
  redirect("/admin/songs");
}
