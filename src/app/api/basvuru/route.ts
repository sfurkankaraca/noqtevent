import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendArtistApplicationReceived } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const VALID_PERFORMER_TYPES = ["dj", "artist", "trio", "dance", "band", "host", "moderator"];
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
  const { ok } = rateLimit(ip, "basvuru-artist", { max: 5, windowMs: 60 * 60_000 }); // 5/saat
  if (!ok) {
    return NextResponse.json({ error: "Çok fazla başvuru. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  try {
    const fd = await req.formData();

    const name = (fd.get("name") as string | null)?.trim().slice(0, 120);
    const email = (fd.get("email") as string | null)?.trim().toLowerCase().slice(0, 200);
    const performer_type_raw = (fd.get("performer_type") as string | null) || "dj";

    if (!name || !email) {
      return NextResponse.json({ error: "Ad ve e-posta zorunludur." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
    }

    const performer_type = VALID_PERFORMER_TYPES.includes(performer_type_raw) ? performer_type_raw : "dj";
    const photos = parseJsonArray(fd.get("photos"), 10);
    const youtube_links = parseJsonArray(fd.get("youtube_links"), 10);
    const event_types = parseJsonArray(fd.get("event_types"), 20);
    const cover_cities = parseJsonArray(fd.get("cover_cities"), 20);

    const supabase = createServiceClient();
    const { error } = await supabase.from("dj_profiles").insert({
      clerk_id: `apply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      performer_type,
      bio: ((fd.get("bio") as string | null) || null)?.slice(0, 2000) ?? null,
      speciality: ((fd.get("speciality") as string | null) || null)?.slice(0, 200) ?? null,
      repertoire: ((fd.get("repertoire") as string | null) || null)?.slice(0, 1000) ?? null,
      city: cover_cities[0] ?? null,
      cover_cities,
      event_types,
      email,
      phone: ((fd.get("phone") as string | null) || null)?.slice(0, 30) ?? null,
      instagram_url: ((fd.get("instagram_url") as string | null) || null)?.slice(0, 300) ?? null,
      spotify_url: ((fd.get("spotify_url") as string | null) || null)?.slice(0, 300) ?? null,
      soundcloud_url: ((fd.get("soundcloud_url") as string | null) || null)?.slice(0, 300) ?? null,
      website_url: ((fd.get("website_url") as string | null) || null)?.slice(0, 300) ?? null,
      youtube_links,
      photos,
      photo_url: photos[0] ?? null,
      application_status: "pending",
      is_active: false,
      concept_tags: [],
      busy_dates: [],
    });

    if (error) {
      console.error("Basvuru insert error:", error.message);
      return NextResponse.json({ error: "Başvuru kaydedilemedi." }, { status: 500 });
    }

    await sendArtistApplicationReceived({ name, email, performer_type });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Basvuru route error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
