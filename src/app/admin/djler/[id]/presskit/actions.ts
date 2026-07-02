"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { RiderItem } from "@/components/admin/RiderBuilder";

type PresskitPayload = {
  id: string;
  slug: string | null;
  bio: string | null;
  speciality: string | null;
  repertoire: string | null;
  email: string | null;
  phone: string | null;
  instagram_url: string | null;
  spotify_url: string | null;
  soundcloud_url: string | null;
  mixcloud_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  rider: RiderItem[];
  rider_url: string | null;
  media_drive_url: string | null;
  photos: string[];
};

export async function savePresskitAction(payload: PresskitPayload) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { id, photos, rider, ...rest } = payload;

  const { error } = await supabase
    .from("dj_profiles")
    .update({
      ...rest,
      photos,
      photo_url: photos[0] ?? null,
      rider,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/s/${payload.slug}`);
  revalidatePath(`/admin/djler/${id}/presskit`);
}
