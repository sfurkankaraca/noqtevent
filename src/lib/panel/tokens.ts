import crypto from "node:crypto";

// Hesapsız onay linkleri (approval_tokens) ve claim doğrulama kodları için
// ortak yardımcılar. Ham token DB'ye ASLA yazılmaz — yalnız sha256 hash
// (TASARIM §3.4, migration yorumu). Token doğrulaması yalnız service_role
// server action'larında yapılır.

export function generateApprovalToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(24).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// IG DM kod yöntemi: kısa, elle yazması/okuması kolay, karışması zor karakter
// seti (0/O, 1/I hariç).
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateClaimCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}
