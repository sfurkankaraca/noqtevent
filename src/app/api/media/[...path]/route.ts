import { NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";

// Türkiye'deki bazı ISP'ler R2'nin public Cloudflare IP aralıklarını (188.114.x, 104.18.x)
// engelliyor; media.noqt.events tarayıcıdan erişilemiyor. Bu route medyayı Vercel üzerinden
// (sunucu→R2, engelsiz) çekip kullanıcıya Vercel IP'lerinden servis ederek engeli aşar.
// Range desteğiyle video seek çalışır.

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.map(decodeURIComponent).join("/");

  // R2 anahtarı bu bucket'ın yükleme yapısına uymalı (traversal / dışarı erişim engeli)
  if (!key || key.includes("..")) {
    return new Response("Bad request", { status: 400 });
  }

  const range = req.headers.get("range") ?? undefined;

  try {
    const obj = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Range: range })
    );

    const body = obj.Body?.transformToWebStream();
    if (!body) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    if (obj.ContentType) headers.set("Content-Type", obj.ContentType);
    if (obj.ContentLength != null) headers.set("Content-Length", String(obj.ContentLength));
    if (obj.ContentRange) headers.set("Content-Range", obj.ContentRange);
    if (obj.ETag) headers.set("ETag", obj.ETag);
    headers.set("Accept-Ranges", "bytes");
    // Medya içeriği değişmez (path benzersiz) — uzun cache
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(body, { status: range ? 206 : 200, headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
