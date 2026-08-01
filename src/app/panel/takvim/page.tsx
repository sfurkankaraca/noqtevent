import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { getConfirmedEventsForEntityInRange, getMyEntities, getSupplyEventsForEntities } from "@/lib/panel/queries";
import { EVENT_KIND_LABEL, SUPPLY_EVENT_STATUS_BADGE, SUPPLY_EVENT_STATUS_LABEL, formatDateTime } from "@/lib/panel/format";
import { getWeekRange, getMonthRange } from "@/lib/panel/gorsel/period";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "../LinkButton";
import { ImageOptionsControls } from "../ImageOptionsControls";

export default async function TakvimPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; olusturuldu?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const sp = await searchParams;
  const entities = await getMyEntities(user.id);

  if (entities.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl">Takvim</h1>
        <p className="text-sm text-muted-foreground">
          Henüz sahiplendiğiniz bir profil yok.{" "}
          <Link href="/panel/sahiplen" className="underline">
            Profil sahiplenin
          </Link>{" "}
          — takviminiz burada görünecek.
        </p>
      </div>
    );
  }

  const scopedEntityIds = sp.entity ? [sp.entity] : entities.map((e) => e.entityId);
  const events = await getSupplyEventsForEntities(scopedEntityIds);
  const nameByEntityId = new Map(entities.map((e) => [e.entityId, e.displayName]));

  // Takvim görseli (haftalık/aylık) tek bir entity'ye ait olmak zorunda —
  // "Tümü" görünümünde birden çok profil varsa kullanıcının önce birini
  // seçmesi gerekiyor (bkz. aşağıdaki uyarı bloğu).
  const calendarEntityId = sp.entity ?? (entities.length === 1 ? entities[0].entityId : null);
  let weekCount = 0;
  let monthCount = 0;
  if (calendarEntityId) {
    const weekRange = getWeekRange();
    const monthRange = getMonthRange();
    [weekCount, monthCount] = await Promise.all([
      getConfirmedEventsForEntityInRange(calendarEntityId, weekRange.startIso, weekRange.endIso).then((r) => r.length),
      getConfirmedEventsForEntityInRange(calendarEntityId, monthRange.startIso, monthRange.endIso).then((r) => r.length),
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl">Takvim</h1>
        <LinkButton href={sp.entity ? `/panel/etkinlik/yeni?as=${sp.entity}` : "/panel/etkinlik/yeni"} size="sm">
          + Etkinlik
        </LinkButton>
      </div>

      {entities.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Link href="/panel/takvim">
            <Badge variant={!sp.entity ? "default" : "outline"}>Tümü</Badge>
          </Link>
          {entities.map((e) => (
            <Link key={e.entityId} href={`/panel/takvim?entity=${e.entityId}`}>
              <Badge variant={sp.entity === e.entityId ? "default" : "outline"}>{e.displayName}</Badge>
            </Link>
          ))}
        </div>
      )}

      {sp.olusturuldu === "1" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Etkinlik oluşturuldu.</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Takvim görseli</CardTitle>
          <CardDescription>
            {calendarEntityId
              ? "Bu haftaki veya bu aydaki onaylı etkinliklerinizi tek bir story/post görselinde paylaşın."
              : "Takvim görseli üretmek için yukarıdan bir profil seçin."}
          </CardDescription>
        </CardHeader>
        {calendarEntityId && (
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Haftalık</p>
              <ImageOptionsControls
                basePath={`/panel/takvim/gorsel?entityId=${calendarEntityId}&period=week`}
                disabled={weekCount === 0}
                disabledReason="Bu hafta onaylı etkinlik yok."
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Aylık</p>
              <ImageOptionsControls
                basePath={`/panel/takvim/gorsel?entityId=${calendarEntityId}&period=month`}
                disabled={monthCount === 0}
                disabledReason="Bu ay (bugünden itibaren) onaylı etkinlik yok."
              />
            </div>
          </CardContent>
        )}
      </Card>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz etkinlik yok.</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{ev.title}</CardTitle>
                  <Badge variant={SUPPLY_EVENT_STATUS_BADGE[ev.status]}>{SUPPLY_EVENT_STATUS_LABEL[ev.status]}</Badge>
                </div>
                <CardDescription>
                  {formatDateTime(ev.start_at)} · {EVENT_KIND_LABEL[ev.event_kind]} ·{" "}
                  {nameByEntityId.get(ev.venue_entity_id) ?? "Mekan"}
                  {ev.city ? ` · ${ev.city}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ev.status === "pending_counterparty" && (
                  <p className="text-xs text-muted-foreground">
                    Karşı tarafın onayı bekleniyor — yalnız sizin profilinizde görünüyor.
                  </p>
                )}
                <ImageOptionsControls basePath={`/panel/etkinlik/${ev.id}/gorsel`} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
