"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { FocalPoint } from "@/components/admin/FocalPointPicker";
import { sendArtistApprovalNotification } from "@/lib/email";

export async function upsertDj(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;

  const photos: string[] = JSON.parse((formData.get("photos_json") as string) || "[]");
  const focal_points: Record<string, FocalPoint> = JSON.parse(
    (formData.get("focal_points_json") as string) || "{}"
  );

  const rider: unknown[] = (() => { try { return JSON.parse(formData.get("rider_json") as string ?? "[]"); } catch { return []; } })();

  const concept_tags = (formData.get("concept_tags") as string)
    .split(",").map((t) => t.trim()).filter(Boolean);
  const busy_dates = (formData.get("busy_dates") as string)
    .split(",").map((d) => d.trim()).filter(Boolean);
  const event_types: string[] = JSON.parse((formData.get("event_types_json") as string) || "[]");
  const youtube_links: string[] = JSON.parse((formData.get("youtube_links_json") as string) || "[]");

  const payload = {
    name: formData.get("name") as string,
    bio: (formData.get("bio") as string) || null,
    performer_type: (formData.get("performer_type") as string) || "dj",
    speciality: (formData.get("speciality") as string) || null,
    city: (formData.get("city") as string) || null,
    soundcloud_url: (formData.get("soundcloud_url") as string) || null,
    mixcloud_url: (formData.get("mixcloud_url") as string) || null,
    youtube_url: (formData.get("youtube_url") as string) || null,
    instagram_url: (formData.get("instagram_url") as string) || null,
    spotify_url: (formData.get("spotify_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    slug: (formData.get("slug") as string) || null,
    rider_url: (formData.get("rider_url") as string) || null,
    rider,
    media_drive_url: (formData.get("media_drive_url") as string) || null,
    application_status: (formData.get("application_status") as string) || "approved",
    repertoire: (formData.get("repertoire") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    event_types,
    youtube_links,
    concept_tags,
    busy_dates,
    is_active: formData.get("is_active") === "true",
    photos,
    focal_points,
    photo_url: photos[0] ?? null,
    preview_video_url: (formData.get("preview_video_url") as string) || null,
    videos: (() => { try { return JSON.parse(formData.get("videos_json") as string); } catch { return []; } })(),
  };

  if (id) {
    // Onay durumu değişiyor mu kontrol et
    const { data: prev } = await supabase
      .from("dj_profiles")
      .select("application_status, email, name")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("dj_profiles").update(payload).eq("id", id);
    if (error) {
      if (error.message.includes("photos") || error.message.includes("focal_points")) {
        const { photos: _p, focal_points: _fp, ...safe } = payload;
        const { error: e2 } = await supabase.from("dj_profiles").update(safe).eq("id", id);
        if (e2) throw new Error(e2.message);
      } else {
        throw new Error(error.message);
      }
    }

    // Pending → approved geçişinde sanatçıya mail at
    if (
      prev &&
      prev.application_status === "pending" &&
      payload.application_status === "approved" &&
      prev.email
    ) {
      await sendArtistApprovalNotification({ name: prev.name, email: prev.email });
    }
  } else {
    const { error } = await supabase.from("dj_profiles").insert({
      ...payload,
      clerk_id: `admin-${Date.now()}`,
    });
    if (error) {
      if (error.message.includes("photos") || error.message.includes("focal_points")) {
        const { photos: _p, focal_points: _fp, ...safe } = payload;
        const { error: e2 } = await supabase.from("dj_profiles").insert({
          ...safe,
          clerk_id: `admin-${Date.now()}`,
        });
        if (e2) throw new Error(e2.message);
      } else {
        throw new Error(error.message);
      }
    }
  }

  revalidatePath("/admin/djler");
}

export async function deleteDj(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = createServiceClient();
  await supabase.from("dj_profiles").delete().eq("id", id);
  revalidatePath("/admin/djler");
}
