import { sendMagicLinkAction, verifyOtpCodeAction } from "@/lib/panel/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function PanelGirisPage({
  searchParams,
}: {
  searchParams: Promise<{ gonderildi?: string; hata?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Panele giriş</CardTitle>
          <CardDescription>
            E-posta adresinize tek kullanımlık bir giriş kodu ve bağlantı gönderelim. Şifre gerekmez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sp.gonderildi && (
            <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              <strong>{sp.gonderildi}</strong> adresine gönderildi. Maildeki <strong>giriş kodunu</strong>{" "}
              aşağıya girin (veya bağlantıya tıklayın). Spam klasörünü de kontrol edin.
            </div>
          )}
          {sp.hata && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{sp.hata}</div>
          )}
          {sp.gonderildi ? (
            // Kod girişi: magic link'in e-posta tarayıcıları tarafından
            // "önceden tıklanıp" tüketilmesine (otp_expired) bağışık yol.
            <form action={verifyOtpCodeAction} className="space-y-3">
              <input type="hidden" name="email" value={sp.gonderildi} />
              <div className="space-y-1.5">
                <Label htmlFor="code">Maildeki giriş kodu</Label>
                {/* Supabase OTP uzunluğu proje ayarına göre 6-10 hane olabilir
                    (bu projede 8 geldiği görüldü) — kutu sabit 6'ya kilitlenmez. */}
                <Input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,10}"
                  maxLength={10}
                  required
                  placeholder="12345678"
                />
              </div>
              <Button type="submit" className="w-full">
                Giriş yap
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Kod gelmediyse{" "}
                <a className="underline" href="/panel/giris">
                  yeniden gönder
                </a>
                .
              </p>
            </form>
          ) : (
            <form action={sendMagicLinkAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" name="email" type="email" required placeholder="ornek@mekan.com" />
              </div>
              <Button type="submit" className="w-full">
                Giriş kodu gönder
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
