import type { NextRequest } from "next/server";

// Cron uçları için ortak yetki kapısı — Bulgu 3 (güvenlik taraması 2026-09-04).
//
// Eskiden her cron route'unda `if (!secret) return true;` vardı: CRON_SECRET
// tanımsızken uçlar herkese açıktı (fail-open) — müşterilere e-posta gönderimi,
// Gmail içeriğinin işlenmesi ve AI maliyeti tetiklenebiliyordu.
// Artık secret yoksa istek reddedilir (fail-closed) ve durum log'lanır.
//
// Vercel Cron, CRON_SECRET tanımlıysa isteklere otomatik olarak
// `Authorization: Bearer <CRON_SECRET>` başlığını ekler.
export function isCronAuthorized(req: NextRequest, routeName: string): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      `[cron/${routeName}] CRON_SECRET tanımsız — istek reddedildi (fail-closed). Vercel env'e ekleyin.`
    );
    return false;
  }
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
