import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { getR2Stream, deleteFromR2, R2_PUBLIC_URL } from "@/lib/r2";

// Sanatçı başvurusunda yüklenen R2 videosunu YouTube'a (unlisted) taşır,
// dj_profiles.youtube_links'e ekler ve R2 kopyasını siler.

export const runtime = "nodejs";
export const maxDuration = 300;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const YOUTUBE_REFRESH = (process.env.GOOGLE_YOUTUBE_REFRESH_TOKEN ?? process.env.GOOGLE_REFRESH_TOKEN)!;

function r2PathFromUrl(url: string): string | null {
  const base = R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base || !url.startsWith(base)) return null;
  return url.slice(base.length + 1);
}

// GET: admin tanı — env vars + r2 erişimi + gerçek token yenileme testi
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const testUrl = searchParams.get("url");

  let tokenTest: unknown = "(denenmedi)";
  try {
    const ytAuth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    ytAuth.setCredentials({ refresh_token: YOUTUBE_REFRESH });
    const { token } = await ytAuth.getAccessToken();
    tokenTest = token ? "OK — access token alındı" : "Token boş döndü";
  } catch (e) {
    tokenTest = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({
    hasClientId: !!CLIENT_ID,
    hasClientSecret: !!CLIENT_SECRET,
    hasRefreshToken: !!YOUTUBE_REFRESH,
    clientIdPrefix: CLIENT_ID?.slice(0, 20),
    r2PublicUrl: R2_PUBLIC_URL ?? "(boş)",
    r2PathFromUrl: testUrl ? r2PathFromUrl(testUrl) : "(url param verilmedi)",
    tokenTest,
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const missing = [
    !CLIENT_ID && "GOOGLE_CLIENT_ID",
    !CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
    !YOUTUBE_REFRESH && "GOOGLE_REFRESH_TOKEN",
  ].filter(Boolean);
  if (missing.length) {
    return NextResponse.json({ error: `Eksik env: ${missing.join(", ")}` }, { status: 500 });
  }

  const { profileId, videoUrl } = (await req.json()) as { profileId?: string; videoUrl?: string };
  if (!profileId || !videoUrl) {
    return NextResponse.json({ error: "profileId ve videoUrl gerekli" }, { status: 400 });
  }

  const r2Path = r2PathFromUrl(videoUrl);
  if (!r2Path) {
    return NextResponse.json({
      error: `Bu video R2'de değil, taşınamaz. (R2_PUBLIC_URL: ${R2_PUBLIC_URL ?? "boş"}, videoUrl: ${videoUrl})`,
    }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("dj_profiles")
    .select("id, name, videos, youtube_links")
    .eq("id", profileId)
    .single();

  if (!profile) return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const ytAuth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  ytAuth.setCredentials({ refresh_token: YOUTUBE_REFRESH });
  const youtube = google.youtube({ version: "v3", auth: ytAuth });

  let stream;
  try {
    stream = await getR2Stream(r2Path);
  } catch {
    return NextResponse.json({ error: "R2'den video alınamadı" }, { status: 502 });
  }

  const title = `${profile.name ?? "Sanatçı"} — Performans Videosu`.slice(0, 100);

  let youtubeUrl: string;
  try {
    const ytRes = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title, description: "NOQT Experience · noqt.events", categoryId: "22" },
        status: { privacyStatus: "unlisted" },
      },
      media: { body: stream },
    });
    youtubeUrl = `https://www.youtube.com/watch?v=${ytRes.data.id}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "YouTube yükleme hatası";
    const friendly = msg.includes("quota")
      ? "YouTube günlük yükleme kotası doldu. Yarın tekrar deneyin."
      : msg;
    return NextResponse.json({ error: friendly }, { status: 502 });
  }

  // youtube_links'e ekle, videos'dan çıkar
  const currentVideos: string[] = Array.isArray(profile.videos) ? profile.videos : [];
  const currentYt: string[] = Array.isArray(profile.youtube_links) ? profile.youtube_links : [];

  await supabase.from("dj_profiles").update({
    videos: currentVideos.filter((u) => u !== videoUrl),
    youtube_links: [...currentYt, youtubeUrl],
    preview_video_url: currentVideos.filter((u) => u !== videoUrl)[0] ?? null,
  }).eq("id", profileId);

  await deleteFromR2(r2Path).catch((e) => console.error("[artist-video-to-youtube] R2 delete:", e));

  return NextResponse.json({ youtubeUrl });
}
