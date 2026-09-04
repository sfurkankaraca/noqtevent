import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import {
  decodePassthrough,
  deleteAsset,
  MAX_DURATION_SECONDS,
  muxPlaybackUrl,
  verifyMuxWebhookSignature,
} from "@/lib/panel/mux";

// Mux'un video işlemeyi bitirince çağırdığı webhook — asıl "video kullanıma
// hazır mı" kararı BURADA verilir (mux-upload-init yalnız yükleme URL'si
// üretir, henüz bir video_urls girdisi eklemez).
//
// SÜRE KOTASI (kurucu kararı, 2026-08-07): 60 saniyeyi aşan video Mux'tan
// SİLİNİR ve video_urls'e hiç eklenmez — video sayısına sınır yok, yalnız
// süreye (bkz. mux.ts dosya başı maliyet notu: Mux dakika bazlı ücretlendirir,
// bu kontrol maliyeti sınırlayan tek mekanizma).
//
// Bu route KULLANICI OTURUMU görmez (Mux'un sunucusu çağırır) — güvenlik
// sınırı imza doğrulamasıdır (MUX_WEBHOOK_SECRET), panel oturumu değil.

export const runtime = "nodejs";

const TABLE_BY_KIND = { venue: "venue_details", artist: "artist_profiles" } as const;

interface MuxAssetPayload {
  id?: string;
  upload_id?: string;
  duration?: number;
  passthrough?: string;
  playback_ids?: Array<{ id: string; policy: string }>;
}

export async function POST(req: NextRequest) {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MUX_WEBHOOK_SECRET tanımlı değil — webhook doğrulanamıyor.");
    return NextResponse.json({ error: "Webhook yapılandırılmamış." }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("mux-signature");
  if (!verifyMuxWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Geçersiz imza." }, { status: 401 });
  }

  let event: { type?: string; data?: MuxAssetPayload };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Geçersiz gövde." }, { status: 400 });
  }

  const type = event.type ?? "";
  if (type !== "video.asset.ready" && type !== "video.asset.errored") {
    // İlgilenmediğimiz olay türleri (video.asset.created, video.upload.*
    // vb.) — 200 dönülür, aksi halde Mux tekrar tekrar dener.
    return NextResponse.json({ ok: true, ignored: type });
  }

  const data = event.data ?? {};
  const passthrough = decodePassthrough(data.passthrough);
  const uploadId = data.upload_id;
  const assetId = data.id;
  if (!passthrough || !uploadId || !assetId) {
    console.error("Mux webhook: passthrough/upload_id/asset id eksik.", { type, data });
    // Hatalı/eksik payload'ı tekrar denetmenin faydası yok — 200 ile kapat.
    return NextResponse.json({ ok: true, skipped: "eksik alan" });
  }

  const table = TABLE_BY_KIND[passthrough.k];
  const supabase = createServiceClient();
  const { data: row, error: fetchError } = await supabase
    .from(table)
    .select("video_assets, video_urls")
    .eq("entity_id", passthrough.e)
    .maybeSingle();
  if (fetchError) {
    console.error("Mux webhook: satır okunamadı:", fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!row) {
    // Profil bu arada silinmiş olabilir — video_assets güncellenecek bir
    // yer kalmadı, asset'i temizleyip kapatıyoruz.
    await deleteAsset(assetId).catch(() => {});
    return NextResponse.json({ ok: true, skipped: "profil bulunamadı" });
  }

  const assets: Array<Record<string, unknown>> = Array.isArray(row.video_assets) ? row.video_assets : [];
  const idx = assets.findIndex((a) => a.uploadId === uploadId);
  if (idx === -1) {
    console.error("Mux webhook: uploadId video_assets içinde bulunamadı.", { uploadId, entityId: passthrough.e });
    return NextResponse.json({ ok: true, skipped: "eşleşen kayıt yok" });
  }

  const videoUrls: string[] = Array.isArray(row.video_urls) ? row.video_urls : [];

  if (type === "video.asset.errored") {
    assets[idx] = { ...assets[idx], status: "errored", assetId };
    await supabase.from(table).update({ video_assets: assets }).eq("entity_id", passthrough.e);
    return NextResponse.json({ ok: true });
  }

  // video.asset.ready
  const duration = typeof data.duration === "number" ? data.duration : null;
  const publicPlayback = (data.playback_ids ?? []).find((p) => p.policy === "public");

  if (duration !== null && duration > MAX_DURATION_SECONDS) {
    // Süre kotasını AŞTI — video hiçbir zaman video_urls'e girmez, Mux
    // tarafında da tutulmaz (depolama maliyeti + ileride kafa karışıklığı
    // yaratmasın diye asset'in kendisi silinir).
    await deleteAsset(assetId).catch((e) =>
      console.error("Mux webhook: aşırı süreli asset silinemedi:", e),
    );
    assets[idx] = {
      ...assets[idx],
      status: "rejected_duration",
      assetId,
      durationSeconds: duration,
    };
    await supabase.from(table).update({ video_assets: assets }).eq("entity_id", passthrough.e);
    return NextResponse.json({ ok: true, rejected: "duration" });
  }

  if (!publicPlayback) {
    console.error("Mux webhook: ready ama public playback_id yok.", { assetId });
    assets[idx] = { ...assets[idx], status: "errored", assetId, durationSeconds: duration };
    await supabase.from(table).update({ video_assets: assets }).eq("entity_id", passthrough.e);
    return NextResponse.json({ ok: true, skipped: "playback_id yok" });
  }

  assets[idx] = {
    ...assets[idx],
    status: "ready",
    assetId,
    playbackId: publicPlayback.id,
    durationSeconds: duration,
  };

  const streamUrl = muxPlaybackUrl(publicPlayback.id);
  const nextVideoUrls = videoUrls.includes(streamUrl) ? videoUrls : [...videoUrls, streamUrl];

  const { error: updateError } = await supabase
    .from(table)
    .update({ video_assets: assets, video_urls: nextVideoUrls })
    .eq("entity_id", passthrough.e);
  if (updateError) {
    console.error("Mux webhook: güncelleme başarısız:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
