import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import {
  getAppStats,
  getSupplyHealth,
  getUserProfileStats,
  getUserBreakdowns,
} from "@/lib/panel/appAdminQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Tile({ label, value, sub, warn }: { label: string; value: number | string; sub?: string; warn?: boolean }) {
  return (
    <Card className={warn ? "border-destructive" : undefined}>
      <CardHeader>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {label}
        {sub && <div className="mt-0.5 text-xs text-muted-foreground/70">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function formatDateTime(d: Date | null): string {
  if (!d) return "hiç çalışmadı";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ---- Günlük kayıt bar grafiği — grafik kütüphanesi yok, düz div bar ----
function DailySignupChart({ data }: { data: { dayKey: string; dateLabel: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex h-32 items-end gap-1.5">
          {data.map((d) => (
            <div key={d.dayKey} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.dateLabel}: ${d.count}`}>
              <span className="text-[10px] font-medium text-muted-foreground">{d.count || ""}</span>
              <div
                className={d.count ? "w-full rounded-t bg-primary" : "w-full rounded-t bg-muted"}
                style={{ height: d.count ? `${Math.max(4, (d.count / max) * 100)}%` : "2px" }}
              />
              <span className="whitespace-nowrap text-[9.5px] text-muted-foreground/70">{d.dateLabel}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Son {data.length} günde günlük yeni kayıt (AI profilleri hariç).</p>
      </CardContent>
    </Card>
  );
}

// ---- Şehir / cinsiyet dağılım çubukları — düz div bar ----
function DistBars({ rows, emptyLabel }: { rows: { label: string; count: number }[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{emptyLabel}</CardContent>
      </Card>
    );
  }
  const top = rows[0].count;
  return (
    <Card>
      <CardContent className="space-y-2.5 pt-6">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-sm">
            <span className="w-24 flex-shrink-0 truncate text-muted-foreground" title={r.label}>
              {r.label}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${(r.count / top) * 100}%` }} />
            </span>
            <span className="w-9 flex-shrink-0 text-right text-sm font-semibold">{r.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default async function AppAdminStatsPage() {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const [stats, profile, breakdowns, supply] = await Promise.all([
    getAppStats(),
    getUserProfileStats(),
    getUserBreakdowns(),
    getSupplyHealth(),
  ]);

  const swipeToMatch = stats.users > 0 ? (stats.matches / stats.users).toFixed(1) : null;
  const pct = (n: number) => (stats.users > 0 ? `%${Math.round((n / stats.users) * 100)}` : undefined);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl">Uygulama — İstatistikler</h1>
        <p className="text-sm text-muted-foreground">
          eventmatch Firestore aggregate sayaçları — eski kurucu paneli (panel/index.html) ile metrik paritesinde.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Büyüme</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Kullanıcı" value={stats.users} sub={`+${stats.newUsers7d} son 7 gün · +${stats.newUsers30d} son 30 gün`} />
          <Tile label="Eşleşme" value={stats.matches} sub={swipeToMatch ? `kullanıcı başına ${swipeToMatch}` : undefined} />
          <Tile label="Plan (goTogether)" value={stats.plans} sub={`${stats.activePlans} tanesi aktif`} />
          <Tile label="Kaydedilen etkinlik" value={stats.eventInterest} sub="eventSwipes · going=true" />
          <Tile label="Kaydedilen mekan" value={stats.savedVenues} sub="kullanıcı × mekan" />
          <Tile label="Doğrulanmış buluşma" value={stats.verifiedMeetups} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Moderasyon</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Bekleyen şikayet" value={stats.openReports} warn={stats.openReports > 0} />
          <Tile label="Yeni geri bildirim" value={stats.newFeedback} />
          <Tile label="Bekleyen doğrulama" value={stats.pendingVerifications} warn={stats.pendingVerifications > 0} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Günlük kayıt</h2>
        <DailySignupChart data={breakdowns.dailySignups} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Kullanıcı profili</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Fotoğraf yükleyen" value={profile.withPhoto} sub={pct(profile.withPhoto)} />
          <Tile label="Soru cevaplayan" value={breakdowns.answeredQuestions} sub={pct(breakdowns.answeredQuestions)} />
          <Tile label="Doğrulanmış" value={profile.verified} />
          <Tile label="Gold üyelik" value={profile.gold} sub="v1 lansmanında hepsi ücretsiz" />
          <Tile label="AI tanıtım profili" value={stats.bots} sub="kullanıcı sayısına dahil değil" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Şehir & cinsiyet</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Şehir (ilk 10)</h3>
            <DistBars rows={breakdowns.cities} emptyLabel="Şehir verisi yok." />
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Cinsiyet</h3>
            <DistBars rows={breakdowns.genders} emptyLabel="Cinsiyet verisi yok." />
          </div>
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
