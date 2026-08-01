"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createPanelServerClient } from "@/lib/panel/supabaseServer";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Panel giriş: e-posta magic link. Kayıt/giriş aynı akış (Supabase
// signInWithOtp shouldCreateUser: true ile ilk seferde otomatik kullanıcı
// oluşturur — panel kullanıcıları için ayrı bir "kayıt ol" ekranı yok).
export async function sendMagicLinkAction(formData: FormData): Promise<void> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { ok } = rateLimit(ip, "panel-magic-link", { max: 5, windowMs: 15 * 60_000 });

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!ok) {
    redirect(`/panel/giris?hata=${encodeURIComponent("Çok fazla deneme yapıldı, birkaç dakika sonra tekrar deneyin.")}`);
  }
  if (!EMAIL_RE.test(email)) {
    redirect(`/panel/giris?hata=${encodeURIComponent("Geçerli bir e-posta adresi girin.")}`);
  }

  // Magic link, İSTEĞİN GELDİĞİ host'a dönmeli: doğrulama çerezi (PKCE code
  // verifier) o host'a yazılıyor; link başka host'a dönerse "süresi dolmuş"
  // hatası çıkar. Bu yüzden öncelik istek origin'inde — NEXT_PUBLIC_URL ana
  // sitenin değişkeni (www.noqt.events; sitemap/meta kullanıyor), panel için
  // yalnız son çare. Güvenlik: Supabase Redirect URL izin listesi zaten
  // yalnız kayıtlı callback adreslerini kabul eder, host header'ı bu yüzden
  // güvenle kullanılabilir.
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const requestOrigin = headersList.get("origin") || (host ? `${proto}://${host}` : "");
  const baseUrl = requestOrigin || process.env.NEXT_PUBLIC_URL || "";
  const supabase = await createPanelServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${baseUrl}/panel/auth/callback`,
    },
  });

  if (error) {
    redirect(`/panel/giris?hata=${encodeURIComponent("Bağlantı gönderilemedi: " + error.message)}`);
  }

  redirect(`/panel/giris?gonderildi=${encodeURIComponent(email)}`);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createPanelServerClient();
  await supabase.auth.signOut();
  redirect("/panel");
}
