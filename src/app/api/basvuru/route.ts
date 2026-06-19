import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const fd = await req.formData();

    const name = (fd.get("name") as string | null)?.trim();
    const email = (fd.get("email") as string | null)?.trim();
    const performer_type = (fd.get("performer_type") as string | null) || "dj";

    if (!name || !email) {
      return NextResponse.json({ error: "Ad ve e-posta zorunludur." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("dj_profiles").insert({
      clerk_id: `apply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      performer_type,
      city: (fd.get("city") as string | null) || null,
      speciality: (fd.get("speciality") as string | null) || null,
      bio: (fd.get("bio") as string | null) || null,
      instagram_url: (fd.get("instagram_url") as string | null) || null,
      spotify_url: (fd.get("spotify_url") as string | null) || null,
      website_url: (fd.get("website_url") as string | null) || null,
      application_status: "pending",
      is_active: false,
      concept_tags: [],
      busy_dates: [],
    });

    if (error) {
      console.error("Basvuru insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Basvuru route error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
