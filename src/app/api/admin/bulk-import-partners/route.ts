// GEÇİCİ toplu partner import/güncelleme endpoint'i (v2) — aday firmaları
// "pending" durumunda ekler; mevcut kayıtların SADECE BOŞ alanlarını doldurur
// (elle girilen veriyi asla ezmez). E-posta GÖNDERMEZ. İş bitince SİLİNECEK.
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const IMPORT_TOKEN = "cdae5ca41757959e6f040029b8e8673ba498b93f41fd3c3a652f1a8c071e88a6";

type IncomingPartner = {
  business_name: string;
  category?: string[];
  description?: string;
  services?: string[];
  event_types?: string[];
  logo_url?: string;
  photos?: string[];
  city?: string;
  cover_cities?: string[];
  instagram_url?: string;
  website_url?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
};

function authorized(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${IMPORT_TOKEN}`;
}

// Mevcut durumu görmek için: id, ad, şehir, kategori, foto sayısı, durum.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("partner_profiles")
    .select("id, business_name, city, category, photos, logo_url, application_status, is_active")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    (data ?? []).map((p) => ({
      id: p.id,
      business_name: p.business_name,
      city: p.city,
      category: p.category,
      photo_count: Array.isArray(p.photos) ? p.photos.length : 0,
      has_logo: !!p.logo_url,
      application_status: p.application_status,
      is_active: p.is_active,
    }))
  );
}

// Yeni kayıt ekler; aynı isimde kayıt varsa atlar.
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let partners: IncomingPartner[];
  try {
    partners = await req.json();
    if (!Array.isArray(partners)) throw new Error("array bekleniyor");
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const inserted: string[] = [];
  const skipped: string[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const p of partners) {
    const name = (p.business_name ?? "").trim().slice(0, 200);
    if (!name) continue;

    const { data: existing } = await supabase
      .from("partner_profiles")
      .select("id")
      .ilike("business_name", name)
      .limit(1);
    if (existing && existing.length > 0) {
      skipped.push(name);
      continue;
    }

    const { error } = await supabase.from("partner_profiles").insert({
      business_name: name,
      category: Array.isArray(p.category) ? p.category.slice(0, 10) : [],
      description: p.description?.slice(0, 2000) || null,
      services: Array.isArray(p.services) ? p.services.slice(0, 30) : [],
      event_types: Array.isArray(p.event_types) ? p.event_types.slice(0, 20) : [],
      logo_url: p.logo_url?.slice(0, 500) || null,
      photos: Array.isArray(p.photos) ? p.photos.slice(0, 10) : [],
      city: p.city?.slice(0, 100) || null,
      cover_cities: Array.isArray(p.cover_cities) ? p.cover_cities.slice(0, 20) : [],
      instagram_url: p.instagram_url?.slice(0, 300) || null,
      website_url: p.website_url?.slice(0, 300) || null,
      contact_name: p.contact_name?.slice(0, 120) || null,
      email: p.email?.slice(0, 200) || null,
      phone: p.phone?.slice(0, 30) || null,
      application_status: "pending",
      is_active: false,
    });

    if (error) failed.push({ name, error: error.message });
    else inserted.push(name);
  }

  return NextResponse.json({ inserted, skipped, failed });
}

// Mevcut kaydın SADECE boş alanlarını doldurur; fotoğrafı/verisi olan alana dokunmaz.
export async function PATCH(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let partners: IncomingPartner[];
  try {
    partners = await req.json();
    if (!Array.isArray(partners)) throw new Error("array bekleniyor");
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const updated: { name: string; fields: string[] }[] = [];
  const untouched: string[] = [];
  const notFound: string[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const p of partners) {
    const name = (p.business_name ?? "").trim();
    if (!name) continue;

    const { data: rows } = await supabase
      .from("partner_profiles")
      .select("id, description, logo_url, photos, instagram_url, website_url, email, phone, city, cover_cities")
      .ilike("business_name", name)
      .limit(1);
    const existing = rows?.[0];
    if (!existing) {
      notFound.push(name);
      continue;
    }

    const patch: Record<string, unknown> = {};
    const isEmpty = (v: unknown) =>
      v == null || v === "" || (Array.isArray(v) && v.length === 0);

    if (isEmpty(existing.photos) && Array.isArray(p.photos) && p.photos.length > 0)
      patch.photos = p.photos.slice(0, 10);
    if (isEmpty(existing.logo_url) && p.logo_url) patch.logo_url = p.logo_url.slice(0, 500);
    if (isEmpty(existing.description) && p.description) patch.description = p.description.slice(0, 2000);
    if (isEmpty(existing.instagram_url) && p.instagram_url) patch.instagram_url = p.instagram_url.slice(0, 300);
    if (isEmpty(existing.website_url) && p.website_url) patch.website_url = p.website_url.slice(0, 300);
    if (isEmpty(existing.email) && p.email) patch.email = p.email.slice(0, 200);
    if (isEmpty(existing.phone) && p.phone) patch.phone = p.phone.slice(0, 30);
    if (isEmpty(existing.city) && p.city) patch.city = p.city.slice(0, 100);
    if (isEmpty(existing.cover_cities) && Array.isArray(p.cover_cities) && p.cover_cities.length > 0)
      patch.cover_cities = p.cover_cities.slice(0, 20);

    if (Object.keys(patch).length === 0) {
      untouched.push(name);
      continue;
    }

    const { error } = await supabase.from("partner_profiles").update(patch).eq("id", existing.id);
    if (error) failed.push({ name, error: error.message });
    else updated.push({ name, fields: Object.keys(patch) });
  }

  return NextResponse.json({ updated, untouched, notFound, failed });
}
