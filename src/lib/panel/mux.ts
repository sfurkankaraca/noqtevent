import crypto from "node:crypto";

// Mux Video — native video yükleme (kurucu talebi 2026-08-07: "YouTube olmak
// zorunda olmadan video yüklenmesi, ama akıcı bir şekilde takılmadan
// izletilebilsin"). Ham fetch + Basic Auth kullanılıyor — googlePlaces.ts ve
// enrich-*.mjs script'lerindeki AYNI desen (bu depoda üçüncü parti API SDK'sı
// yerine ham HTTP çağrısı tercih ediliyor), ayrı bir bağımlılık eklemiyor.
//
// MALİYET NOTU (kurucuya sunulan tahminle tutarlı, 2026-08-07): Mux dakikaya
// göre ücretlendiriyor, dosya boyutuna göre DEĞİL — bu yüzden maliyet
// kontrolü SÜRE KOTASIYLA yapılıyor (bkz. MAX_DURATION_SECONDS aşağıda),
// dosya boyutu sınırı değil.

const MUX_API_BASE = "https://api.mux.com";

function getCredentials(): { tokenId: string; tokenSecret: string } {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error("MUX_TOKEN_ID / MUX_TOKEN_SECRET tanımlı değil.");
  }
  return { tokenId, tokenSecret };
}

function authHeader(): string {
  const { tokenId, tokenSecret } = getCredentials();
  return `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64")}`;
}

async function muxFetch(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${MUX_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = (json as { error?: { messages?: string[] } })?.error?.messages?.join(", ");
    throw new Error(`Mux API hatası (HTTP ${res.status}): ${detail ?? text.slice(0, 300)}`);
  }
  return (json as { data?: unknown })?.data ?? json;
}

/// Panel/webhook arasında entity kimliğini taşıyan kompakt passthrough.
/// Mux'un `passthrough` alanı 255 karakterle sınırlı — UUID + kind + uploadId
/// bu sınırın çok altında kalır, JSON.stringify hâlâ okunabilir/hata ayıklanabilir.
export interface UploadPassthrough {
  k: "venue" | "artist";
  e: string; // entityId
}

export function encodePassthrough(p: UploadPassthrough): string {
  return JSON.stringify(p);
}

export function decodePassthrough(raw: unknown): UploadPassthrough | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UploadPassthrough>;
    if ((parsed.k === "venue" || parsed.k === "artist") && typeof parsed.e === "string") {
      return { k: parsed.k, e: parsed.e };
    }
  } catch {
    // aşağıda null döner
  }
  return null;
}

export interface DirectUpload {
  uploadId: string;
  uploadUrl: string;
}

/// Tarayıcının doğrudan (server'ımızı atlayarak) dosya PUT edeceği imzalı
/// bir yükleme URL'si oluşturur — büyük video dosyalarını Vercel fonksiyon
/// gövde limitinden geçirmemek için (photo upload route'undaki gibi
/// server'a proxy'lemek yerine).
export async function createDirectUpload(
  passthrough: UploadPassthrough,
  corsOrigin: string,
): Promise<DirectUpload> {
  const data = (await muxFetch("/video/v1/uploads", {
    method: "POST",
    body: JSON.stringify({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policy: ["public"],
        // Statik MP4 türevi İSTENMİYOR — yalnız HLS (in-app oynatıcı bunu
        // kullanıyor, bkz. eventmatch supply_media_gallery.dart), ekstra
        // depolama/hazırlama maliyeti doğurmasın.
        mp4_support: "none",
        passthrough: encodePassthrough(passthrough),
      },
    }),
  })) as { id?: string; url?: string };
  if (!data.id || !data.url) throw new Error("Mux upload yanıtı eksik (id/url).");
  return { uploadId: data.id, uploadUrl: data.url };
}

export interface MuxAssetInfo {
  assetId: string;
  status: string; // "preparing" | "ready" | "errored"
  durationSeconds: number | null;
  playbackId: string | null;
}

export async function getAsset(assetId: string): Promise<MuxAssetInfo> {
  const data = (await muxFetch(`/video/v1/assets/${assetId}`)) as {
    id: string;
    status: string;
    duration?: number;
    playback_ids?: Array<{ id: string; policy: string }>;
  };
  const publicPlayback = (data.playback_ids ?? []).find((p) => p.policy === "public");
  return {
    assetId: data.id,
    status: data.status,
    durationSeconds: typeof data.duration === "number" ? data.duration : null,
    playbackId: publicPlayback?.id ?? null,
  };
}

export async function deleteAsset(assetId: string): Promise<void> {
  await muxFetch(`/video/v1/assets/${assetId}`, { method: "DELETE" });
}

/// Mux webhook imzasını doğrular — `mux-signature: t=<epoch>,v1=<hmac>`.
/// HMAC, `${timestamp}.${rawBody}` üzerinden webhook secret ile SHA-256
/// olarak hesaplanır (Mux belgelerindeki format). Zaman damgası 5 dakikadan
/// eskiyse reddedilir (replay saldırısı penceresini daraltır).
export function verifyMuxWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  // Zamanlama saldırısına karşı sabit-zamanlı karşılaştırma.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/// Panel/eventmatch ortak sözleşmesi: bir Mux playback id'sinden herkese açık
/// HLS oynatma adresi. `video_urls`e (harici link listesi) bu biçimde
/// eklenir; Flutter tarafı `stream.mux.com` host'unu tanıyıp inline oynatıcı
/// açar (bkz. supply_media_gallery.dart `extractMuxPlaybackId`).
export function muxPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

/// Kurucu kararı (2026-08-07): sanatçı/mekan videosu en fazla 60 saniye —
/// video SAYISINA sınır yok, yalnız SÜREYE (Mux dakika bazlı ücretlendiriyor,
/// dosya boyutu değil — bkz. dosya başı maliyet notu).
export const MAX_DURATION_SECONDS = 60;
