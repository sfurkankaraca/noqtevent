import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getPendingSupplyEvents } from "@/lib/panel/adminQueries";
import { getEntityDisplayName } from "@/lib/panel/queries";
import { confirmEventAdminAction, rejectEventAdminAction } from "@/lib/panel/actions/admin";
import { EVENT_KIND_LABEL, formatDateTime } from "@/lib/panel/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ islem?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const sp = await searchParams;
  const events = await getPendingSupplyEvents();

  const rows = await Promise.all(
    events.map(async (ev) => ({
      ev,
      venueName: await getEntityDisplayName(ev.venue_entity_id, "venue"),
    }))
  );

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl">Bekleyen etkinlikler</h1>
      <p className="text-sm text-muted-foreground">
        Karşı taraf henüz onaylamadı. Gerekirse admin burada doğrudan onaylayabilir/reddedebilir
        (çakışma uyarıları ve düşük güven puanı incelemesi bu ekranın ileri fazı — bkz. rapor).
      </p>

      {sp.islem === "onaylandi" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Etkinlik onaylandı.</div>
      )}
      {sp.islem === "reddedildi" && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">Etkinlik reddedildi.</div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bekleyen etkinlik yok.</p>
      ) : (
        <div className="space-y-4">
          {rows.map(({ ev, venueName }) => (
            <Card key={ev.id}>
              <CardHeader>
                <CardTitle>{ev.title}</CardTitle>
                <CardDescription>
                  {venueName} · {formatDateTime(ev.start_at)} · {EVENT_KIND_LABEL[ev.event_kind]} ·{" "}
                  {ev.created_by_side === "venue" ? "Mekan ekledi" : "Sanatçı ekledi"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <form action={confirmEventAdminAction}>
                  <input type="hidden" name="eventId" value={ev.id} />
                  <Button type="submit" size="sm">
                    Onayla
                  </Button>
                </form>
                <details>
                  <summary className="cursor-pointer text-sm text-destructive">Reddet</summary>
                  <form action={rejectEventAdminAction} className="mt-2 space-y-2">
                    <input type="hidden" name="eventId" value={ev.id} />
                    <Textarea name="reason" placeholder="Red gerekçesi (opsiyonel)" rows={2} />
                    <Button type="submit" size="sm" variant="destructive">
                      Reddi onayla
                    </Button>
                  </form>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
