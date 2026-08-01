import { NextResponse } from "next/server";
import { createPanelServerClient } from "@/lib/panel/supabaseServer";

// Magic link redirect hedefi. Supabase e-postadaki bağlantı kendi
// /auth/v1/verify uç noktasından buraya "code" parametresiyle yönlendirir
// (PKCE akışı — @supabase/ssr varsayılanı). Route Handler cookie set
// edebildiği için oturum burada kalıcı olarak kuruluyor.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/panel";

  if (code) {
    const supabase = await createPanelServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/panel/giris?hata=${encodeURIComponent("Oturum açılamadı, bağlantının süresi dolmuş olabilir.")}`
  );
}
