import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getRecentInvites } from "@/lib/panel/adminQueries";
import { getEntityDisplayName, getEntityKind } from "@/lib/panel/queries";
import { formatDateTime } from "@/lib/panel/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminInvitesPage() {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const invites = await getRecentInvites();
  const rows = await Promise.all(
    invites.map(async (inv) => {
      const kind = await getEntityKind(inv.target_entity_id);
      const name = kind ? await getEntityDisplayName(inv.target_entity_id, kind) : "(silinmiş profil)";
      return { inv, name };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl">Davetler</h1>
      <p className="text-sm text-muted-foreground">
        Hedef profile ulaşılmayanlar / hatırlatma listesi ileride bu ekrana eklenecek (bkz. rapor).
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz davet yok.</p>
      ) : (
        <div className="space-y-3">
          {rows.map(({ inv, name }) => (
            <Card key={inv.id}>
              <CardHeader>
                <CardTitle className="text-base">{name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{inv.invited_via}</Badge>
                <span>Gönderildi: {formatDateTime(inv.sent_at)}</span>
                {inv.clicked_at && <span>· Tıklandı: {formatDateTime(inv.clicked_at)}</span>}
                {inv.claimed_at && <span>· Sahiplenildi: {formatDateTime(inv.claimed_at)}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
