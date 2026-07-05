import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { getR2Stream, deleteFromR2 } from "@/lib/r2";

// Memory Drive videosunu R2'den YouTube'a (unlisted) taşır, youtube_url'i kaydeder
// ve R2 kopyasını siler (yer tasarrufu). Büyük videolar için uzun süre gerekebilir.

export const runtime = "nodejs";
export const maxDuration = 300;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const YOUTUBE_REFRESH = (process.env.GOOGLE_YOUTUBE_REFRESH_TOKEN ?? process.env.GOOGLE_REFRESH_TOKEN)!;

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const missing = [
    !CLIENT_ID && "GOOGLE_CLIENT_ID",
    !CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
    !YOUTUBE_REFRESH && "GOOGLE_REFRESH_TOKEN (veya GOOGLE_YOUTUBE_REFRESH_TOKEN)",
  ].filter(Boolean);
  if (missing.length) {
    return NextResponse.json({ error: `Eksik env: ${missing.join(", ")}` }, { status: 500 });
  }

  const { uploadId } = (await req.json()) as { uploadId?: string };
  if (!uploadId) return NextResponse.json({ error: "uploadId gerekli" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: upload } = await supabase
    .from("memory_uploads")
    .select("id, file_path, file_name, file_type, youtube_url, event_id")
    .eq("id", uploadId)
    .single();

  if (!upload) return NextResponse.json({ error: "Yükleme bulunamadı" }, { status: 404 });
  if (upload.file_type !== "video") return NextResponse.json({ error: "Bu dosya video değil" }, { status: 400 });
  if (upload.youtube_url) return NextResponse.json({ youtubeUrl: upload.youtube_url, already: true });

  // Etkinlik başlığını video başlığında kullan
  const { data: ev } = await supabase.from("memory_events").select("title").eq("id", upload.event_id).single();
  const title = `${ev?.title ?? "NOQT Memory"} — ${upload.file_name ?? "video"}`.slice(0, 100);

  const ytAuth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  ytAuth.setCredentials({ refresh_token: YOUTUBE_REFRESH });
  const youtube = google.youtube({ version: "v3", auth: ytAuth });

  let stream;
  try {
    stream = await getR2Stream(upload.file_path);
  } catch {
    return NextResponse.json({ error: "R2'den dosya alınamadı" }, { status: 502 });
  }

  let youtubeUrl: string;
  try {
    const ytRes = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title, description: "NOQT Memory Drive · noqt.events", categoryId: "22" },
        status: { privacyStatus: "unlisted" },
      },
      media: { body: stream },
    });
    youtubeUrl = `https://www.youtube.com/watch?v=${ytRes.data.id}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "YouTube yükleme hatası";
    // Kota aşımı gibi durumları anlaşılır göster
    const friendly = msg.includes("quota")
      ? "YouTube günlük yükleme kotası doldu. Yarın tekrar deneyin."
      : msg;
    return NextResponse.json({ error: friendly }, { status: 502 });
  }

  // youtube_url'i kaydet, sonra R2 kopyasını sil
  await supabase.from("memory_uploads").update({ youtube_url: youtubeUrl }).eq("id", upload.id);
  await deleteFromR2(upload.file_path).catch((e) => console.error("[memory-to-youtube] R2 delete:", e));

  return NextResponse.json({ youtubeUrl });
}
