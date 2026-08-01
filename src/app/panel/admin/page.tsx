import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getAdminCounts } from "@/lib/panel/adminQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const counts = await getAdminCounts();

  const tiles = [
    { label: "Potansiyel mekan", value: counts.potentialVenues, href: "/panel/admin/mekanlar" },
    { label: "Potansiyel sanatçı", value: counts.potentialArtists, href: "/panel/admin/sanatcilar" },
    { label: "Mekan (toplam)", value: counts.venues, href: "/panel/admin/mekanlar?sekme=approved" },
    { label: "Sanatçı (toplam)", value: counts.artists, href: "/panel/admin/sanatcilar?sekme=approved" },
    { label: "Onaylı etkinlik", value: counts.confirmedEvents },
    { label: "Onay bekleyen etkinlik", value: counts.pendingEvents, href: "/panel/admin/etkinlikler" },
    { label: "Bekleyen sahiplenme başvurusu", value: counts.pendingClaims, href: "/panel/admin/claims" },
    { label: "Gönderilen davet", value: counts.invitesSent, href: "/panel/admin/davetler" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl">Admin — Arz operasyonu</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => {
          const content = (
            <Card key={t.label} className="h-full">
              <CardHeader>
                <CardTitle className="text-3xl">{t.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{t.label}</CardContent>
            </Card>
          );
          return t.href ? (
            <Link key={t.label} href={t.href}>
              {content}
            </Link>
          ) : (
            content
          );
        })}
      </div>
    </div>
  );
}
