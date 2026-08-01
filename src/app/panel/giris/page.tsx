import { sendMagicLinkAction } from "@/lib/panel/actions/auth";
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
            E-posta adresinize tek kullanımlık bir giriş bağlantısı gönderelim. Şifre gerekmez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sp.gonderildi && (
            <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              <strong>{sp.gonderildi}</strong> adresine giriş bağlantısı gönderildi. Gelen kutunuzu
              (ve spam klasörünü) kontrol edin.
            </div>
          )}
          {sp.hata && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{sp.hata}</div>
          )}
          <form action={sendMagicLinkAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" required placeholder="ornek@mekan.com" />
            </div>
            <Button type="submit" className="w-full">
              Giriş bağlantısı gönder
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
