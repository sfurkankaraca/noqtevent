import { createServiceClient } from "@/lib/supabase";
import { hashToken } from "@/lib/panel/tokens";
import { getEntityDisplayName } from "@/lib/panel/queries";
import { approveByTokenAction, rejectByTokenAction } from "@/lib/panel/actions/tokenApproval";
import { EVENT_KIND_LABEL, SUPPLY_EVENT_STATUS_LABEL, formatDateTime } from "@/lib/panel/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SupplyEventRow } from "@/lib/panel/types";

export const metadata = { title: "Etkinlik onayı | NOQT" };

type PreviewResult =
  | { ok: false; error: string }
  | { ok: true; event: SupplyEventRow; expired: boolean; used: boolean };

async function loadPreview(token: string): Promise<PreviewResult> {
  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from("approval_tokens")
    .select("supply_event_id, expires_at, used_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!row) return { ok: false, error: "Bu onay bağlantısı geçersiz." };

  const { data: event } = await supabase
    .from("supply_events")
    .select("*")
    .eq("id", row.supply_event_id)
    .maybeSingle<SupplyEventRow>();
  if (!event) return { ok: false, error: "Etkinlik bulunamadı." };

  const expired = new Date(row.expires_at).getTime() < Date.now();
  const used = !!row.used_at;

  return { ok: true, event, expired, used };
}

export default async function OnayTokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ sonuc?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const result = await loadPreview(token);

  const venueName = result.ok ? await getEntityDisplayName(result.event.venue_entity_id, "venue") : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Etkinlik onayı</CardTitle>
          <CardDescription>NOQT — hesapsız onay bağlantısı</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result.ok ? (
            <p className="text-sm text-destructive">{result.error}</p>
          ) : sp.sonuc === "onaylandi" ? (
            <p className="text-sm text-primary">Etkinlik onaylandı, teşekkürler.</p>
          ) : sp.sonuc === "reddedildi" ? (
            <p className="text-sm text-muted-foreground">Etkinlik reddedildi.</p>
          ) : result.used || result.event.status !== "pending_counterparty" ? (
            <p className="text-sm text-muted-foreground">
              Bu etkinlik için işlem zaten yapılmış. Güncel durum: {SUPPLY_EVENT_STATUS_LABEL[result.event.status]}
            </p>
          ) : result.expired ? (
            <p className="text-sm text-destructive">Bu onay bağlantısının süresi dolmuş.</p>
          ) : (
            <>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{result.event.title}</p>
                <p className="text-muted-foreground">
                  {formatDateTime(result.event.start_at)} · {EVENT_KIND_LABEL[result.event.event_kind]}
                </p>
                <p className="text-muted-foreground">{venueName}</p>
                {result.event.description && <p>{result.event.description}</p>}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <form action={approveByTokenAction} className="flex-1">
                  <input type="hidden" name="token" value={token} />
                  <Button type="submit" className="w-full">
                    Onayla
                  </Button>
                </form>
              </div>
              <details>
                <summary className="cursor-pointer text-sm text-destructive">Reddet</summary>
                <form action={rejectByTokenAction} className="mt-2 space-y-2">
                  <input type="hidden" name="token" value={token} />
                  <Textarea name="reason" placeholder="Red gerekçesi (opsiyonel)" rows={2} />
                  <Button type="submit" variant="destructive" className="w-full">
                    Reddi onayla
                  </Button>
                </form>
              </details>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
