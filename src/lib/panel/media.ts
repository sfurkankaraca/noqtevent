// Sanatçı/mekan medya galerisi paylaşılan yardımcılar — hem client bileşeni
// (src/components/panel/MediaManager.tsx) hem de server action'lar
// (src/lib/panel/actions/admin.ts) AYNI video URL kuralını kullanır.
// İstemci tarafı doğrulama yalnız UX içindir; asıl güvenlik sınırı server
// action'daki tekrar-doğrulama — istemci JS'i atlayan bir istek burada
// yine reddedilir/filtrelenir.

// `stream.mux.com` — native (Mux) video oynatma adresleri (mux-webhook
// route'unun video_urls'e eklediği format, bkz. lib/panel/mux.ts
// muxPlaybackUrl). BU EKLENMEDEN önce bir bug vardı: webhook video_urls'e
// bu host'tan bir adres yazıyor, ama admin profili bir SONRAKİ kez
// kaydettiğinde updateVenueAdminAction -> parseVideoUrlList bu host'u
// tanımadığı için native videoyu SESSİZCE video_urls'ten düşürüyordu.
const ALLOWED_VIDEO_HOSTS =
  /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)vimeo\.com$|^stream\.mux\.com$/i;

export function isAllowedVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ALLOWED_VIDEO_HOSTS.test(u.hostname);
  } catch {
    return false;
  }
}

// Serbest metin (satır satır) video URL listesini ayrıştırır, boşları atar,
// yalnız izinli host'ları bırakır ve tekrarları temizler — server action'lardan
// çağrılır.
export function parseVideoUrlList(raw: FormDataEntryValue | null): string[] {
  const lines = String(raw ?? "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
  return Array.from(new Set(lines.filter(isAllowedVideoUrl)));
}

// `https://stream.mux.com/{playbackId}.m3u8`den playback id'yi çıkarır —
// MediaManager listede native videoyu ham .m3u8 linki yerine okunabilir bir
// etiketle göstermek için kullanır. Eşleşmezse null (YouTube/Vimeo linki).
export function extractMuxPlaybackId(url: string): string | null {
  const m = /^https:\/\/stream\.mux\.com\/([^./]+)\.m3u8$/.exec(url.trim());
  return m ? m[1] : null;
}

// Satır satır fotoğraf URL listesini ayrıştırır (boş satırları atar).
// Video listesinden farklı olarak host kısıtlaması yok — bu URL'ler yalnız
// panelin kendi yükleme rotasından (/api/panel/media/upload) veya mevcut
// düzenleme akışından gelir.
export function parsePhotoUrlList(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
}
