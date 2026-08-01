import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getAppStats, getSupplyHealth } from "@/lib/panel/appAdminQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{label}</CardContent>
    </Card>
  );
}

function formatDateTime(d: Date | null): string {
  if (!d) return "hiç çalışmadı";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AppAdminStatsPage() {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const [stats, supply] = await Promise.all([getAppStats(), getSupplyHealth()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl">Uygulama — İstatistikler</h1>
        <p className="text-sm text-muted-foreground">eventmatch Firestore aggregate sayaçları (functions/src/admin-stats.ts karşılığı).</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Kullanıcı & etkileşim</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Toplam kullanıcı (bot hariç)" value={stats.users} />
          <Tile label="Son 7 gün yeni kullanıcı" value={stats.newUsers7d} />
          <Tile label="Bot hesap" value={stats.bots} />
          <Tile label="Eşleşme" value={stats.matches} />
          <Tile label="Plan (goTogether)" value={stats.plans} />
          <Tile label="Doğrulanmış buluşma" value={stats.verifiedMeetups} />
          <Tile label="Açık şikayet" value={stats.openReports} />
          <Tile label="Yeni geri bildirim" value={stats.newFeedback} />
          <Tile label="Bekleyen doğrulama" value={stats.pendingVerifications} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Keşif sağlığı (etkinlik arzı)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Onaylı etkinlik" value={supply.eventStatusCounts.confirmed} />
          <Tile label="Onay bekleyen (tek taraflı)" value={supply.eventStatusCounts.pending_counterparty} />
          <Tile label="İptal edilen" value={supply.eventStatusCounts.cancelled} />
          <Tile label="Sanatçı profili" value={supply.artistProfiles} />
          <Tile label="Mekan profili" value={supply.venueProfiles} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sync worker durumu</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {supply.lastSync ? (
              <>
                Son koşu: {formatDateTime(supply.lastSync.runAt)} ·{" "}
                <span className={supply.lastSync.status === "error" ? "text-destructive" : ""}>
                  {supply.lastSync.status ?? "bilinmiyor"}
                </span>
              </>
            ) : (
              "config/supplySync dokümanı yok — sync worker henüz hiç çalışmamış (V1 iş sırası, bkz. ETKINLIK_KESIF_V1_TASARIM.md §5.2)."
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
