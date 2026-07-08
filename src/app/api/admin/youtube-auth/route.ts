import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { isAdmin } from "@/lib/adminAuth";

// YouTube OAuth yenileme akışı.
// GET  → yetkilendirme URL'i döndürür (tarayıcıda aç)
// GET?code=xxx → code'u refresh token'a çevirir

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events"}/api/admin/youtube-auth`;

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const code = new URL(req.url).searchParams.get("code");

  if (!code) {
    // Adım 1: yetkilendirme URL'i üret
    const authUrl = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
    });
    return NextResponse.json({ authUrl, message: "Bu URL'i tarayıcıda aç ve izin ver." });
  }

  // Adım 2: code → token
  try {
    const { tokens } = await oauth2.getToken(code);
    return NextResponse.json({
      refresh_token: tokens.refresh_token,
      message: "Bu refresh_token'ı Vercel'de GOOGLE_YOUTUBE_REFRESH_TOKEN olarak kaydet.",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Token alınamadı" }, { status: 500 });
  }
}
