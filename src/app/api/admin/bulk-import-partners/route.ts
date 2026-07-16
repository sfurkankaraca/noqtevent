// GEÇİCİ toplu partner import endpoint'i — araştırılan aday firmaları
// "pending" durumunda (onaysız, pasif) sisteme ekler. E-posta GÖNDERMEZ.
// Kullanım bittikten sonra bu dosya SİLİNECEK.
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const IMPORT_TOKEN = "19fcb36ee0a313047416a3a30b913d5bbdc8e0a7d06719d9650caf85422c9719";

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

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${IMPORT_TOKEN}`) {
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
