import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
// GOOGLE_DRIVE_REFRESH_TOKEN: Drive API için ayrı refresh token
const DRIVE_REFRESH = process.env.GOOGLE_DRIVE_REFRESH_TOKEN!;
// GOOGLE_REFRESH_TOKEN: Vercel'deki mevcut YouTube token'ı (GOOGLE_YOUTUBE_REFRESH_TOKEN da kabul edilir)
const YOUTUBE_REFRESH = (process.env.GOOGLE_YOUTUBE_REFRESH_TOKEN ?? process.env.GOOGLE_REFRESH_TOKEN)!;

function extractFileId(link: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = link.match(re);
    if (m) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{20,}$/.test(link.trim())) return link.trim();
  return null;
}

export async function POST(req: NextRequest) {
  const missing = [
    !CLIENT_ID && "GOOGLE_CLIENT_ID",
    !CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
    !DRIVE_REFRESH && "GOOGLE_DRIVE_REFRESH_TOKEN",
    !YOUTUBE_REFRESH && "GOOGLE_REFRESH_TOKEN (veya GOOGLE_YOUTUBE_REFRESH_TOKEN)",
  ].filter(Boolean);

  if (missing.length) {
    return NextResponse.json(
      { error: `Eksik env: ${missing.join(", ")}` },
      { status: 500 }
    );
  }

  const { driveUrl, title } = await req.json() as { driveUrl: string; title?: string };

  if (!driveUrl) {
    return NextResponse.json({ error: "driveUrl gerekli" }, { status: 400 });
  }

  const fileId = extractFileId(driveUrl);
  if (!fileId) {
    return NextResponse.json({ error: "Geçerli bir Drive linki değil" }, { status: 400 });
  }

  const driveAuth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  driveAuth.setCredentials({ refresh_token: DRIVE_REFRESH });

  const ytAuth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  ytAuth.setCredentials({ refresh_token: YOUTUBE_REFRESH });

  const drive = google.drive({ version: "v3", auth: driveAuth });
  const youtube = google.youtube({ version: "v3", auth: ytAuth });

  // Get file metadata for title fallback
  let fileName = "";
  try {
    const meta = await drive.files.get({
      fileId,
      fields: "name,mimeType",
      supportsAllDrives: true,
    });
    fileName = meta.data.name?.replace(/\.[^/.]+$/, "") ?? "";
    if (meta.data.mimeType && !meta.data.mimeType.startsWith("video/")) {
      return NextResponse.json(
        { error: `Bu dosya video değil: ${meta.data.mimeType}` },
        { status: 400 }
      );
    }
  } catch {
    // Drive erişimi olmayabilir, devam et
  }

  const videoTitle = title?.trim() || fileName || `NOQT Performans ${new Date().getFullYear()}`;

  // Drive'dan stream al
  const driveRes = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" }
  );

  // YouTube'a yükle (Drive stream doğrudan media.body olarak)
  const ytRes = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: videoTitle,
        description: "noqt.events",
        categoryId: "10", // Music
      },
      status: { privacyStatus: "unlisted" },
    },
    media: {
      mimeType: "video/mp4",
      body: driveRes.data,
    },
  });

  const youtubeUrl = `https://www.youtube.com/watch?v=${ytRes.data.id}`;
  return NextResponse.json({ youtubeUrl, title: videoTitle });
}
