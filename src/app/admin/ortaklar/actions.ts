"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { FocalPoint } from "@/components/admin/FocalPointPicker";

export async function upsertPartner(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;

  const logo_url = (formData.get("logo_url") as string) || null;
  const portfolio_images: string[] = JSON.parse((formData.get("portfolio_json") as string) || "[]");
  const focal_points: Record<string, FocalPoint> = JSON.parse(
    (formData.get("focal_points_json") as string) || "{}"
  );

  let services: { name: string; price_range: string }[] = [];
  try {
    services = JSON.parse((formData.get("services_json") as string) || "[]");
  } catch {}

  const payload = {
    company_name: formData.get("company_name") as string,
    description: (formData.get("description") as string) || null,
    contact_email: (formData.get("contact_email") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    service_category: formData.get("service_category") as string,
    services,
    portfolio_images,
    focal_points,
    is_active: formData.get("is_active") === "true",
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
  const id = formData.get("id") as string;
  const supabase = createServiceClient();
  await supabase.from("partner_profiles").delete().eq("id", id);
  revalidatePath("/admin/ortaklar");
}

export async function removePortfolioImage(partnerId: string, url: string) {
  const supabase = createServiceClient();
  const { data: partner } = await supabase
    .from("partner_profiles")
    .select("portfolio_images, focal_points")
    .eq("id", partnerId)
    .single();
  if (!partner) return;
  const updated = (partner.portfolio_images as string[]).filter((u: string) => u !== url);
  const fp = { ...(partner.focal_points as Record<string, FocalPoint> ?? {}) };
  delete fp[url];
  await supabase
    .from("partner_profiles")
    .update({ portfolio_images: updated, focal_points: fp })
    .eq("id", partnerId);
  revalidatePath("/admin/ortaklar");
}
