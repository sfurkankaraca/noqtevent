import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const fd = await req.formData();

    const business_name = (fd.get("business_name") as string | null)?.trim();
    const email = (fd.get("email") as string | null)?.trim();

    if (!business_name || !email) {
      return NextResponse.json({ error: "İşletme adı ve e-posta zorunludur." }, { status: 400 });
    }

    const parse = (key: string) => {
      try { return JSON.parse(fd.get(key) as string ?? "[]"); } catch { return []; }
    };

    const supabase = createServiceClient();
    const { error } = await supabase.from("partner_profiles").insert({
      business_name,
      category: parse("category"),
      description: (fd.get("description") as string | null) || null,
      services: parse("services"),
      event_types: parse("event_types"),
      logo_url: (fd.get("logo_url") as string | null) || null,
      photos: parse("photos"),
      city: (fd.get("city") as string | null) || null,
      cover_cities: parse("cover_cities"),
      instagram_url: (fd.get("instagram_url") as string | null) || null,
      website_url: (fd.get("website_url") as string | null) || null,
      contact_name: (fd.get("contact_name") as string | null) || null,
      email,
      phone: (fd.get("phone") as string | null) || null,
      application_status: "pending",
      is_active: false,
    });

    if (error) {
      console.error("Partner insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Partner route error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
