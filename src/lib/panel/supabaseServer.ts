import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Panel kullanıcı-context Supabase client'ı: anon key + kullanıcı çerezleri,
// RLS kurallarına tabi (bkz. supabase/migrations/20260801130000_...sql).
// Server Component / Server Action / Route Handler içinde çağrılır.
//
// ÖNEMLİ: Next.js, bir Server Component render'ı SIRASINDA cookie set etmeye
// izin vermez (yalnız Server Action/Route Handler'da mümkün) — bu yüzden
// setAll aşağıda try/catch içinde no-op'a düşer. Sonuç: oturum tazeleme
// (token refresh) yalnız bir Server Action veya Route Handler çalıştığında
// gerçekleşir, salt-okunur bir sayfa render'ında DEĞİL. Bu depoda panel
// route'larını da kapsayacak bir orta katman (middleware/proxy) tazeleme
// akışı KURULMADI — bkz. final rapor "bilinçli eksik" notu.
export async function createPanelServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Panel Supabase yapılandırması eksik: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil."
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component render'ından çağrıldıysa buraya düşer — zararsız.
        }
      },
    },
  });
}

// Giriş yapmış panel kullanıcısını döndürür (yoksa null). getUser() Supabase
// Auth sunucusuna doğrulatır — cookie'deki JWT'ye kör güvenmez.
export async function getPanelUser() {
  const supabase = await createPanelServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
