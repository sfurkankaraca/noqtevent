"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function upsertPartner(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;

  const parse = (key: string, fallback: unknown = []) => {
    try { return JSON.parse(formData.get(key) as string ?? ""); } catch { return fallback; }
  };

  const photosRaw = formData.get("photos_json") as string;
  const photos: string[] = photosRaw ? JSON.parse(photosRaw) : [];

  const payload = {
    business_name: formData.get("business_name") as string,
    category: parse("category_json"),
    description: (formData.get("description") as string) || null,
    services: parse("services_json"),
    event_types: parse("event_types_json"),
    logo_url: (formData.get("logo_url") as string) || null,
    photos,
    city: (formData.get("city") as string) || null,
    cover_cities: parse("cover_cities_json"),
    instagram_url: (formData.get("instagram_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    contact_name: (formData.get("contact_name") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    application_status: (formData.get("application_status") as string) || "approved",
    is_active: formData.get("is_active") === "true",
  };

  if (id) {
    const { error } = await supabase.from("partner_profiles").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("partner_profiles").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/partnerler");
}

export async function deletePartner(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = createServiceClient();
  await supabase.from("partner_profiles").delete().eq("id", id);
  revalidatePath("/admin/partnerler");
}
