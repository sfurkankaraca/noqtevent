"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { FocalPoint } from "@/components/admin/FocalPointPicker";

export async function upsertPartner(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;

  const logo_url = (formData.get("logo_url") as string) || null;
  const photos: string[] = JSON.parse((formData.get("photos_json") as string) || "[]");
  const focal_points: Record<string, FocalPoint> = JSON.parse(
    (formData.get("focal_points_json") as string) || "{}"
  );
  const category: string[] = JSON.parse((formData.get("category_json") as string) || "[]");
  const services: string[] = JSON.parse((formData.get("services_json") as string) || "[]");
  const cover_cities: string[] = JSON.parse((formData.get("cover_cities_json") as string) || "[]");

  const payload = {
    business_name: formData.get("business_name") as string,
    description: (formData.get("description") as string) || null,
    category,
    services,
    city: (formData.get("city") as string) || null,
    cover_cities,
    contact_name: (formData.get("contact_name") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    instagram_url: (formData.get("instagram_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    application_status: (formData.get("application_status") as string) || "approved",
    is_active: formData.get("is_active") === "true",
    photos,
    focal_points,
    ...(logo_url ? { logo_url } : {}),
  };

  if (id) {
    const { error } = await supabase.from("partner_profiles").update(payload).eq("id", id);
    if (error) {
      if (error.message.includes("focal_points")) {
        const { focal_points: _fp, ...safe } = payload;
        const { error: e2 } = await supabase.from("partner_profiles").update(safe).eq("id", id);
        if (e2) throw new Error(e2.message);
      } else {
        throw new Error(error.message);
      }
    }
  } else {
    const { error } = await supabase.from("partner_profiles").insert({
      ...payload,
      clerk_id: `admin-${Date.now()}`,
    });
    if (error) {
      if (error.message.includes("focal_points")) {
        const { focal_points: _fp, ...safe } = payload;
        const { error: e2 } = await supabase.from("partner_profiles").insert({
          ...safe,
          clerk_id: `admin-${Date.now()}`,
        });
        if (e2) throw new Error(e2.message);
      } else {
        throw new Error(error.message);
      }
    }
  }

  revalidatePath("/admin/ortaklar");
}

export async function deletePartner(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const supabase = createServiceClient();
  await supabase.from("partner_profiles").delete().eq("id", id);
  revalidatePath("/admin/ortaklar");
}

export async function removePortfolioImage(partnerId: string, url: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: partner } = await supabase
    .from("partner_profiles")
    .select("photos, focal_points")
    .eq("id", partnerId)
    .single();
  if (!partner) return;
  const updated = (partner.photos as string[]).filter((u: string) => u !== url);
  const fp = { ...(partner.focal_points as Record<string, FocalPoint> ?? {}) };
  delete fp[url];
  await supabase
    .from("partner_profiles")
    .update({ photos: updated, focal_points: fp })
    .eq("id", partnerId);
  revalidatePath("/admin/ortaklar");
}
