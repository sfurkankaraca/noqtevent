import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { getMyEntities, getPendingApprovalsForEntities } from "@/lib/panel/queries";
import { EVENT_KIND_LABEL, formatDateTime } from "@/lib/panel/format";
import { approveSupplyEventAction, rejectSupplyEventAction } from "@/lib/panel/actions/approvals";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default async function OnaylarPage({
  searchParams,
}: {
  searchParams: Promise<{ islem?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const sp = await searchParams;
  const entities = await getMyEntities(user.id);
  const pending = await getPendingApprovalsForEntities(entities.map((e) => e.entityId));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl">Onaylar</h1>
      <p className="text-sm text-muted-foreground">
        Diğer taraf sizi etiketleyerek eklediği etkinlikler burada listelenir. Onaylamadan hiçbir
        şey keşif akışında ya da profilinizde görünmez.
      </p>

      {sp.islem === "onaylandi" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Etkinlik onaylandı.</div>
      )}
      {sp.islem === "reddedildi" && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">Etkinlik reddedildi.</div>
      )}

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bekleyen onay yok.</p>
      ) : (
        <div className="space-y-4">
          {pending.map((ev) => (
            <Card key={ev.id}>
              <CardHeader>
                <CardTitle>{ev.title}</CardTitle>
                <CardDescription>
                  {formatDateTime(ev.start_at)} · {EVENT_KIND_LABEL[ev.event_kind]}
                  {ev.city ? ` · ${ev.city}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ev.description && <p className="text-sm">{ev.description}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <form action={approveSupplyEventAction}>
                    <input type="hidden" name="eventId" value={ev.id} />
                    <Button type="submit" size="sm">
                      Onayla
                    </Button>
                  </form>
                  <details className="w-full sm:w-auto">
                    <summary className="cursor-pointer text-sm text-destructive">Reddet</summary>
                    <form action={rejectSupplyEventAction} className="mt-2 space-y-2">
                      <input type="hidden" name="eventId" value={ev.id} />
                      <Textarea name="reason" placeholder="Red gerekçesi (opsiyonel)" rows={2} />
                      <Button type="submit" size="sm" variant="destructive">
                        Reddi onayla
                      </Button>
                    </form>
                  </details>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
