import { getPanelUser } from "@/lib/panel/supabaseServer";

// Panel admin kapısı — noqt.social/site admin'inin (Clerk tabanlı src/lib/adminAuth.ts)
// TAMAMEN AYRISI. Bu, panelin kendi Supabase Auth oturumuna bakar.
//
// Pragmatik karar (TASARIM §4.4, görev talimatı): migration'daki is_admin() SQL
// zinciri credentials.provider='supabase' satırlarına dayanıyor ve bu satırlar
// henüz yazılmıyor (ayrı iş kalemi) — yani veritabanı seviyesinde is_admin()
// bugün HER ZAMAN false döner. Bu yüzden admin ekranlarının kapısı burada,
// uygulama katmanında ADMIN_EMAILS listesiyle kuruluyor. RLS'in "Admin full
// access" politikaları bu yüzden fiilen devre dışı — admin route'ları/action'ları
// bu kontrolü GEÇTİKTEN SONRA verileri service_role client'la okur/yazar
// (bkz. src/lib/panel/actions/admin.ts, src/lib/panel/adminQueries.ts).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function getPanelAdminEmail(): Promise<string | null> {
  const user = await getPanelUser();
  const email = user?.email?.toLowerCase();
  if (!email) return null;
  return ADMIN_EMAILS.includes(email) ? email : null;
}

export async function isPanelAdmin(): Promise<boolean> {
  return (await getPanelAdminEmail()) !== null;
}

// Admin server action'ları için zorunlu guard — çağıran her action'ın en
// başında bulunmalı (layout kontrolü action çağrılarını korumaz). Admin'in
// kullanıcı id'sini de döndürür (claims.reviewed_by gibi alanlar için).
export async function requirePanelAdminUser(): Promise<{ id: string; email: string }> {
  const user = await getPanelUser();
  const email = user?.email?.toLowerCase();
  if (!user || !email || !ADMIN_EMAILS.includes(email)) {
    throw new Error("Yetkisiz erişim: bu işlem yalnız panel admin'i tarafından yapılabilir.");
  }
  return { id: user.id, email };
}
