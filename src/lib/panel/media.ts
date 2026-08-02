// Sanatçı/mekan medya galerisi paylaşılan yardımcılar — hem client bileşeni
// (src/components/panel/MediaManager.tsx) hem de server action'lar
// (src/lib/panel/actions/admin.ts) AYNI video URL kuralını kullanır.
// İstemci tarafı doğrulama yalnız UX içindir; asıl güvenlik sınırı server
// action'daki tekrar-doğrulama — istemci JS'i atlayan bir istek burada
// yine reddedilir/filtrelenir.

const ALLOWED_VIDEO_HOSTS = /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)vimeo\.com$/i;

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
