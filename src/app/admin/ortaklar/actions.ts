"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FocalPoint } from "@/components/admin/FocalPointPicker";

export async function upsertPartner(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;

  // Upload logo
  let logo_url: string | null = (formData.get("existing_logo_url") as string) || null;
  const logoFile = formData.get("logo_file") as File | null;
  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop();
    const path = `partners/logo-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const { data: up, error } = await supabase.storage
      .from("images")
      .upload(path, buffer, { contentType: logoFile.type, upsert: false });
    if (error) throw new Error("Logo yükleme hatası: " + error.message);
    logo_url = supabase.storage.from("images").getPublicUrl(up.path).data.publicUrl;
  }

  // Existing portfolio URLs
  const existingPortfolio: string[] = JSON.parse(
    (formData.get("existing_portfolio") as string) || "[]"
  );

  // Upload new portfolio files
  const portfolioFiles = formData.getAll("portfolio_files") as File[];
  const newUrls: string[] = [];
  for (const file of portfolioFiles) {
    if (!file || file.size === 0) continue;
    const ext = file.name.split(".").pop();
    const path = `partners/portfolio-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data: up, error } = await supabase.storage
      .from("images")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) throw new Error("Portföy yükleme hatası: " + error.message);
    newUrls.push(supabase.storage.from("images").getPublicUrl(up.path).data.publicUrl);
  }

  // Reconstruct ordered list
  const order: string[] = JSON.parse((formData.get("photo_order") as string) || "[]");
  const portfolio_images: string[] = order.length
    ? order.map((key) => {
        if (key.startsWith("new:")) {
          const pos = parseInt(key.split(":")[1]);
          return newUrls[pos - existingPortfolio.length] ?? "";
        }
        return key;
      }).filter(Boolean)
    : [...existingPortfolio, ...newUrls];

  // Remap focal points
  const fpRaw: Record<string, FocalPoint> = JSON.parse(
    (formData.get("focal_points_json") as string) || "{}"
  );
  const focal_points: Record<string, FocalPoint> = {};
  for (const [key, fp] of Object.entries(fpRaw)) {
    if (key.startsWith("new:")) {
      const pos = parseInt(key.split(":")[1]);
      const url = newUrls[pos - existingPortfolio.length];
      if (url) focal_points[url] = fp;
    } else {
      focal_points[key] = fp;
    }
  }

  // Parse services
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
    const { error: updateError } = await supabase.from("partner_profiles").update(payload).eq("id", id);
    if (updateError) {
      if (updateError.message.includes("focal_points")) {
        const { focal_points: _fp, ...safePayload } = payload;
        const { error: retryError } = await supabase.from("partner_profiles").update(safePayload).eq("id", id);
        if (retryError) throw new Error(retryError.message);
      } else {
        throw new Error(updateError.message);
      }
    }
  } else {
    const { error: insertError } = await supabase.from("partner_profiles").insert({
      ...payload,
      clerk_id: `admin-${Date.now()}`,
    });
    if (insertError) {
      if (insertError.message.includes("focal_points")) {
        const { focal_points: _fp, ...safePayload } = payload;
        const { error: retryError } = await supabase.from("partner_profiles").insert({ ...safePayload, clerk_id: `admin-${Date.now()}` });
        if (retryError) throw new Error(retryError.message);
      } else {
        throw new Error(insertError.message);
      }
    }
  }

  revalidatePath("/admin/ortaklar");
  redirect("/admin/ortaklar");
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
