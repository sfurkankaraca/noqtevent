// Admin e-posta listesi — Bulgu 7 (güvenlik taraması 2026-09-04).
// Hem sunucu tarafı requireAdmin() hem de proxy (middleware) aynı listeyi kullansın diye
// Clerk bağımlılığı olmayan ayrı bir modüle çıkarıldı.
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "karaca3888@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  const e = email?.trim().toLowerCase();
  return !!e && ADMIN_EMAILS.includes(e);
}
