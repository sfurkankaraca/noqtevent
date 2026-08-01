import { getPanelUser } from "@/lib/panel/supabaseServer";
import { getMyEntities } from "@/lib/panel/queries";
import { CLAIM_STATUS_LABEL } from "@/lib/panel/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "./LinkButton";

export default async function PanelHomePage({
  searchParams,
}: {
  searchParams: Promise<{ anket?: string }>;
}) {
  const sp = await searchParams;
  const user = await getPanelUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl">NOQT Panel</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mekan mısınız yoksa sanatçı/menajer mi? Profilinizi sahiplenin, takviminizi yönetin,
            gelen etkinlik onaylarını tek yerden yanıtlayın.
          </p>
        </div>
        <LinkButton href="/panel/giris">Giriş yap</LinkButton>
      </div>
    );
  }

  const entities = await getMyEntities(user.id);

  return (
    <div className="space-y-6">
      {sp.anket === "tesekkurler" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
          Anket cevaplarınız için teşekkürler.
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl">Profillerim</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <LinkButton href="/panel/sahiplen" variant="outline">
          + Profil sahiplen
        </LinkButton>
      </div>

      {entities.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Henüz bir profiliniz yok</CardTitle>
            <CardDescription>
              Mekanınızı ya da sanatçı profilinizi arayarak sahiplenme başvurusu yapabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/panel/sahiplen">Profil ara</LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entities.map((e) => (
            <Card key={e.entityId}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{e.displayName}</CardTitle>
                  <Badge variant="outline">{CLAIM_STATUS_LABEL[e.claimStatus]}</Badge>
                </div>
                <CardDescription>
                  {e.kind === "venue" ? "Mekan" : "Sanatçı"} · Rolünüz: {e.memberRole}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <LinkButton href={`/panel/takvim?entity=${e.entityId}`} size="sm" variant="outline">
                  Takvim
                </LinkButton>
                <LinkButton href={`/panel/etkinlik/yeni?as=${e.entityId}`} size="sm" variant="outline">
                  Etkinlik oluştur
                </LinkButton>
                <LinkButton href={`/panel/anket?entity=${e.entityId}`} size="sm" variant="outline">
                  Anket
                </LinkButton>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
