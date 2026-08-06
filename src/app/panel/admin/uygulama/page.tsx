import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Uygulama yönetimi hub'ı (ETKINLIK_KESIF_V1_TASARIM.md §4.3, Dalga 1) —
// eventmatch (Flutter/Firebase) tarafındaki kurucu admin ekranlarının web
// karşılığı. Uygulama içi admin ekranları DONDURULUYOR (yeni özellik almaz);
// bu bölüm asıl merkez.
//
// NOT: bu sayfa appAdminQueries.ts'e (Firebase Admin SDK) hiç dokunmuyor —
// yalnız statik linkler. Bu yüzden uygulama yönetimi köprüsü (bkz.
// src/lib/panel/appAdminBridge.ts) devre dışıyken bile zaten çökmez. İleride
// buraya köprü üzerinden bir özet/sayaç eklenirse aynı safeAdminCall() +
// <AdminBridgeError> deseni (bkz. kullanicilar/geribildirim/istatistikler
// sayfaları) kullanılmalı.

const SECTIONS = [
  {
    href: "/panel/admin/uygulama/kullanicilar",
    label: "Kullanıcılar",
    description: "Arama, blackliste alma/çıkarma, hesap silme.",
  },
  {
    href: "/panel/admin/uygulama/geribildirim",
    label: "Geri bildirim",
    description: "Beta geri bildirim kuyruğu, fotoğraflar, durum işaretleme.",
  },
  {
    href: "/panel/admin/uygulama/istatistikler",
    label: "İstatistikler",
    description: "Kullanıcı/eşleşme/plan sayaçları + keşif arzı sağlığı.",
  },
  {
    href: "/panel/admin/uygulama/sikayetler",
    label: "Şikayetler",
    description: "Bekleyen şikayetler, içerik kaldırma, askıya alma.",
  },
  {
    href: "/panel/admin/uygulama/dogrulama",
    label: "Kimlik doğrulama",
    description: "Bekleyen doğrulama istekleri, selfie inceleme, onay/red.",
  },
];

export default async function AppAdminHubPage() {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Admin — Uygulama yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          eventmatch (Firebase) uygulamasının kurucu admin ekranlarının web köprüsü.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{s.label}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
