import { NextRequest, NextResponse } from "next/server";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { isEntityMember } from "@/lib/panel/queries";
import { createServiceClient } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// Panel medya yükleme rotası — src/app/api/upload/route.ts'in (site admin,
// Clerk tabanlı isAdmin()) TAMAMEN AYRISI. Panel kendi Supabase Auth
// oturumuna bakar (bkz. src/lib/panel/supabaseServer.ts). Görsel araştırması
// sonucu: bu depoda görsel yüklemede mevcut desen Supabase Storage "images"
// bucket'ı + service_role client (R2 yalnız VİDEO dosyaları için kullanılıyor,
// bkz. src/lib/r2.ts) — burada da aynı desen izleniyor, yeni env değişkeni
// gerekmiyor (SUPABASE_SERVICE_ROLE_KEY zaten panelin service client'ında var).
//
// Video dosyası YÜKLEME burada YOK — kurucu talimatına göre video yalnız
// YouTube/Vimeo LİNKİ olarak eklenir (bkz. src/lib/panel/media.ts,
// src/components/panel/MediaManager.tsx).
export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "panel-media-upload", { max: 30, windowMs: 60_000 });
  if (!ok) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const user = await getPanelUser();
  if (!user) {
    return NextResponse.json({ error: "Bu işlem için panel oturumu gerekli." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const entityId = String(formData.get("entityId") ?? "").trim();

  if (!entityId || !UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Geçersiz entityId." }, { status: 400 });
  }

  // Yetki: panel admin VEYA ilgili entity'nin owner/manager'ı — staff medya
  // yükleyemez (isEntityMember varsayılanı owner/manager/staff'tır, burada
  // kasıtlı olarak daraltılıyor; profil bilgisi düzenlemek staff işi değil).
  const admin = await isPanelAdmin();
  if (!admin) {
    const member = await isEntityMember(user.id, entityId, ["owner", "manager"]);
    if (!member) {
      return NextResponse.json({ error: "Bu profilin medyasını yükleme yetkiniz yok." }, { status: 403 });
    }
  }

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }

  const contentType = file.type;
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Yalnız JPEG, PNG veya WEBP dosyaları yüklenebilir." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Dosya boyutu 8 MB limitini aşıyor." }, { status: 400 });
  }

  const ext = EXT_BY_MIME[contentType];
  const path = `${entityId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("images")
    .upload(path, buffer, { contentType, upsert: false });

  if (error) {
    console.error("Panel media upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(data.path);
  return NextResponse.json({ url: urlData.publicUrl, path: data.path });
}
