// Memory Drive galeri erişim kapısı — Bulgu 1 & 2 (güvenlik taraması 2026-09-04).
//
// Galeri "couple" (özel) modundaysa içerik yalnızca gelin & damat'a verilen
// ?k=<gallery_token> linkiyle görülebilir. Aynı mantık hem galeri sayfasında hem de
// toplu indirme ucunda kullanılmalı; bu yüzden tek yardımcıya çıkarıldı.

export type MemoryGalleryGate = {
  gallery_visibility?: string | null;
  gallery_token?: string | null;
};

/** Verilen `k` parametresiyle galeri içeriği görüntülenebilir mi? */
export function canViewMemoryGallery(event: MemoryGalleryGate, k?: string | null): boolean {
  if (event.gallery_visibility !== "couple") return true;
  const token = event.gallery_token;
  // Token hiç üretilmemişse özel galeri kimseye açılmaz (fail-closed).
  if (!token || !k) return false;
  return k === token;
}
