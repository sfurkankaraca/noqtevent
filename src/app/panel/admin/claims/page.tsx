import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getPendingClaims } from "@/lib/panel/adminQueries";
import { getEntityDisplayName, getEntityKind } from "@/lib/panel/queries";
import { createServiceClient } from "@/lib/supabase";
import { approveClaimAdminAction, rejectClaimAdminAction } from "@/lib/panel/actions/admin";
import { formatDateTime } from "@/lib/panel/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ islem?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const sp = await searchParams;
  const claims = await getPendingClaims();
  const supabase = createServiceClient();

  const rows = await Promise.all(
    claims.map(async (c) => {
      const kind = await getEntityKind(c.entity_id);
      const name = kind ? await getEntityDisplayName(c.entity_id, kind) : "(bilinmiyor)";
      const { data: authUser } = await supabase.auth.admin.getUserById(c.claimant_user_id);
      return { claim: c, kind, name, claimantEmail: authUser?.user?.email ?? "(bilinmiyor)" };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Sahiplenme başvuruları</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mekan/sanatçı profilini sahiplenmek isteyen kullanıcıların bekleyen başvuruları.
        </p>
      </div>

      {sp.islem === "onaylandi" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Başvuru onaylandı.</div>
      )}
      {sp.islem === "reddedildi" && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">Başvuru reddedildi.</div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bekleyen başvuru yok.</p>
      ) : (
        <div className="space-y-4">
          {rows.map(({ claim, kind, name, claimantEmail }) => (
            <Card key={claim.id}>
              <CardHeader>
                <CardTitle>
                  {name} <span className="text-sm font-normal text-muted-foreground">({kind === "venue" ? "Mekan" : "Sanatçı"})</span>
                </CardTitle>
                <CardDescription>
                  Başvuran: {claimantEmail} · {formatDateTime(claim.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Yöntem: {claim.method} {claim.code && <>· Kod: <strong>{claim.code}</strong></>}
                  {claim.code_sent_to && <> · Gönderildiği kanal: {claim.code_sent_to}</>}
                </p>
                <p className="text-xs text-muted-foreground">
                  Resmi Instagram DM&apos;inde bu kodu gördüyseniz onaylayın.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={approveClaimAdminAction}>
                    <input type="hidden" name="claimId" value={claim.id} />
                    <Button type="submit" size="sm">
                      Onayla
                    </Button>
                  </form>
                  <details>
                    <summary className="cursor-pointer text-sm text-destructive">Reddet</summary>
                    <form action={rejectClaimAdminAction} className="mt-2 space-y-2">
                      <input type="hidden" name="claimId" value={claim.id} />
                      <Textarea name="notes" placeholder="Red gerekçesi (opsiyonel)" rows={2} />
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
