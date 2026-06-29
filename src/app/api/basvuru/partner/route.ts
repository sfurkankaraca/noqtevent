import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendPartnerApplicationReceived } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseJsonArray(raw: FormDataEntryValue | null, maxItems = 20): string[] {
  try {
    const arr = JSON.parse((raw as string) ?? "[]");
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, maxItems).map((x) => String(x).slice(0, 500));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "basvuru-partner", { max: 5, windowMs: 60 * 60_000 }); // 5/saat
  if (!ok) {
    return NextResponse.json({ error: "Çok fazla başvuru. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  try {
    const fd = await req.formData();

    const business_name = (fd.get("business_name") as string | null)?.trim().slice(0, 200);
    const email = (fd.get("email") as string | null)?.trim().toLowerCase().slice(0, 200);

    if (!business_name || !email) {
      return NextResponse.json({ error: "İşletme adı ve e-posta zorunludur." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("partner_profiles").insert({
      business_name,
      category: parseJsonArray(fd.get("category"), 10),
      description: ((fd.get("description") as string | null) || null)?.slice(0, 2000) ?? null,
      services: parseJsonArray(fd.get("services"), 30),
      event_types: parseJsonArray(fd.get("event_types"), 20),
      logo_url: ((fd.get("logo_url") as string | null) || null)?.slice(0, 500) ?? null,
      photos: parseJsonArray(fd.get("photos"), 10),
      videos: parseJsonArray(fd.get("videos_json"), 10),
      preview_video_url: parseJsonArray(fd.get("videos_json"), 1)[0] ?? null,
      referral_source: ((fd.get("referral_source") as string | null) || null)?.slice(0, 100) ?? null,
      city: ((fd.get("city") as string | null) || null)?.slice(0, 100) ?? null,
      cover_cities: parseJsonArray(fd.get("cover_cities"), 20),
      instagram_url: ((fd.get("instagram_url") as string | null) || null)?.slice(0, 300) ?? null,
      website_url: ((fd.get("website_url") as string | null) || null)?.slice(0, 300) ?? null,
      contact_name: ((fd.get("contact_name") as string | null) || null)?.slice(0, 120) ?? null,
      email,
      phone: ((fd.get("phone") as string | null) || null)?.slice(0, 30) ?? null,
      application_status: "pending",
      is_active: false,
    });

    if (error) {
      console.error("Partner insert error:", error.message);
      return NextResponse.json({ error: "Başvuru kaydedilemedi." }, { status: 500 });
    }

    const contact_name = ((fd.get("contact_name") as string | null) || "").slice(0, 120);
    await sendPartnerApplicationReceived({ business_name, email, contact_name });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Partner route error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
