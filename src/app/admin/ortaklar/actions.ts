"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  // Upload portfolio images (multiple)
  const portfolioFiles = formData.getAll("portfolio_files") as File[];
  const existingPortfolio = JSON.parse((formData.get("existing_portfolio") as string) || "[]") as string[];
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

  // Parse services JSON
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
    portfolio_images: [...existingPortfolio, ...newUrls],
    is_active: formData.get("is_active") === "true",
    ...(logo_url ? { logo_url } : {}),
  };

  if (id) {
    await supabase.from("partner_profiles").update(payload).eq("id", id);
  } else {
    await supabase.from("partner_profiles").insert({
      ...payload,
      clerk_id: `admin-${Date.now()}`,
    });
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
    .select("portfolio_images")
    .eq("id", partnerId)
    .single();
  if (!partner) return;
  const updated = (partner.portfolio_images as string[]).filter((u: string) => u !== url);
  await supabase.from("partner_profiles").update({ portfolio_images: updated }).eq("id", partnerId);
  revalidatePath("/admin/ortaklar");
}
