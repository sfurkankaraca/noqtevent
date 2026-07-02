import crypto from "node:crypto";

// Teklif onayı için tek kullanımlık e-posta doğrulama kodu.
// Stateless HMAC: kod sunucuda saklanmaz, (slug + e-posta + zaman penceresi)
// üzerinden türetilir ve aynı yolla doğrulanır. Pencere 10 dk; önceki pencere
// de kabul edilir (etkin geçerlilik 10-20 dk).

const WINDOW_MS = 10 * 60_000;

function secret(): string {
  const s = process.env.OFFER_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("OTP secret yapılandırılmamış.");
  return s;
}

function codeFor(slug: string, email: string, window: number): string {
  const h = crypto
    .createHmac("sha256", secret())
    .update(`offer-otp:${slug}:${email.trim().toLowerCase()}:${window}`)
    .digest();
  return String(h.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function generateOfferOtp(slug: string, email: string): string {
  return codeFor(slug, email, Math.floor(Date.now() / WINDOW_MS));
}

export function verifyOfferOtp(slug: string, email: string, code: string): boolean {
  const c = String(code).trim();
  if (!/^\d{6}$/.test(c)) return false;
  const w = Math.floor(Date.now() / WINDOW_MS);
  return [w, w - 1].some((win) =>
    crypto.timingSafeEqual(Buffer.from(codeFor(slug, email, win)), Buffer.from(c))
  );
}
