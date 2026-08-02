import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getAdminCounts } from "@/lib/panel/adminQueries";

// Sayaç kartı düzeni noqt.events admin ana sayfasının (src/app/admin/page.tsx
// "Stats" bloğu) birebir karşılığı: ikon + büyük sayı + etiket, beyaz
// rounded-2xl border kart, tamamı ilgili bölüme link. Başlık tipografisi
// (font-heading) panelin kendi marka fontu — /panel/admin/* genelinde
// tutarlı kalsın diye korundu (bilinçli fark, bkz. rapor).
export default async function AdminDashboardPage() {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const counts = await getAdminCounts();

  const tiles = [
    { label: "Potansiyel mekan", value: counts.potentialVenues, href: "/panel/admin/mekanlar", icon: "📍" },
    { label: "Potansiyel sanatçı", value: counts.potentialArtists, href: "/panel/admin/sanatcilar", icon: "🎧" },
    { label: "Mekan (toplam)", value: counts.venues, href: "/panel/admin/mekanlar?sekme=approved", icon: "📍" },
    { label: "Sanatçı (toplam)", value: counts.artists, href: "/panel/admin/sanatcilar?sekme=approved", icon: "🎧" },
    // "Onaylı etkinlik" eskiden href'siz gösteriliyordu — etkinlikler ekranının
    // ayrı bir "onaylı" sekmesi yok (yalnız bekleyenleri listeliyor), yine de
    // "her sayaç ilgili bölüme link olur" talimatı gereği bölüme bağlandı.
    { label: "Onaylı etkinlik", value: counts.confirmedEvents, href: "/panel/admin/etkinlikler", icon: "🗂" },
    { label: "Onay bekleyen etkinlik", value: counts.pendingEvents, href: "/panel/admin/etkinlikler", icon: "🗂" },
    { label: "Bekleyen sahiplenme başvurusu", value: counts.pendingClaims, href: "/panel/admin/claims", icon: "🤝" },
    { label: "Gönderilen davet", value: counts.invitesSent, href: "/panel/admin/davetler", icon: "💌" },
  ];

  const appTiles = [
    { label: "Kullanıcılar", href: "/panel/admin/uygulama/kullanicilar", icon: "👤" },
    { label: "Geri bildirim", href: "/panel/admin/uygulama/geribildirim", icon: "💬" },
    { label: "İstatistikler", href: "/panel/admin/uygulama/istatistikler", icon: "📊" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl">Admin — Arz operasyonu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mekan, sanatçı, etkinlik ve sahiplenme akışının genel görünümü.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-2xl border border-border bg-white p-5 transition-colors hover:border-foreground/20"
          >
            <p className="mb-2 text-2xl">{t.icon}</p>
            <p className="text-3xl font-semibold text-foreground">{t.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="font-heading text-xl">Uygulama (eventmatch)</h2>
        <p className="mb-3 text-sm text-muted-foreground">Firebase tarafındaki kurucu admin ekranlarının web köprüsü.</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {appTiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-2xl border border-border bg-white p-5 transition-colors hover:border-foreground/20"
            >
              <p className="mb-2 text-2xl">{t.icon}</p>
              <p className="text-sm font-medium text-foreground">{t.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
