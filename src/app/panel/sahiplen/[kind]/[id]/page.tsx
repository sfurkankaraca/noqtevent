import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import {
  getArtistByEntityId,
  getLatestClaimForUserEntity,
  getVenueByEntityId,
  isEntityMember,
} from "@/lib/panel/queries";
import { startClaimAction } from "@/lib/panel/actions/claims";
import { CLAIM_ROW_STATUS_LABEL, CLAIM_STATUS_LABEL } from "@/lib/panel/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClaimDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; id: string }>;
  searchParams: Promise<{ basvuru?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const { kind, id } = await params;
  if (kind !== "venue" && kind !== "artist") notFound();
  const sp = await searchParams;

  const profile = kind === "venue" ? await getVenueByEntityId(id) : await getArtistByEntityId(id);
  if (!profile) notFound();

  const name = kind === "venue" ? (profile as { name: string }).name : (profile as { display_name: string }).display_name;
  const claimStatus = profile.claim_status;

  const myClaim = await getLatestClaimForUserEntity(user.id, id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/panel/sahiplen" className="text-sm text-muted-foreground hover:underline">
          ← Aramaya dön
        </Link>
        <h1 className="mt-1 font-heading text-2xl">{name}</h1>
        <Badge variant="outline" className="mt-2">
          {CLAIM_STATUS_LABEL[claimStatus]}
        </Badge>
      </div>

      {sp.basvuru === "1" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Başvurunuz alındı.</div>
      )}

      {claimStatus === "claimed" || claimStatus === "verified" ? (
        (await isEntityMember(user.id, id, ["owner", "manager"])) ? (
          <Card>
            <CardHeader>
              <CardTitle>Bu profil senin</CardTitle>
              <CardDescription>Fotoğraf ve video ekleyip düzenleyebilirsin.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/panel/sahiplen/${kind}/${id}/duzenle`}>
                <Button>Fotoğraf ve videoyu düzenle</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Bu profil zaten sahiplenilmiş</CardTitle>
              <CardDescription>
                Siz bu profilin sahibiyseniz ve erişiminiz yoksa bizimle iletişime geçin.
              </CardDescription>
            </CardHeader>
          </Card>
        )
      ) : myClaim && myClaim.status === "pending" ? (
        <Card>
          <CardHeader>
            <CardTitle>Başvurunuz inceleniyor</CardTitle>
            <CardDescription>Durum: {CLAIM_ROW_STATUS_LABEL[myClaim.status]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {myClaim.code && (
              <>
                <p>
                  Doğrulama kodunuz: <strong className="text-base tracking-widest">{myClaim.code}</strong>
                </p>
                <p className="text-muted-foreground">
                  {myClaim.code_sent_to
                    ? `Bu kodu ${name} hesabının resmi Instagram hesabından (${myClaim.code_sent_to.replace(
                        "instagram:",
                        "@"
                      )}) @noqt hesabımıza DM olarak gönderin.`
                    : "Bu profilde kayıtlı bir Instagram hesabı yok — ekibimiz sizinle elle doğrulama için iletişime geçecek."}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : myClaim && myClaim.status === "rejected" ? (
        <Card>
          <CardHeader>
            <CardTitle>Önceki başvurunuz reddedildi</CardTitle>
            {myClaim.notes && <CardDescription>{myClaim.notes}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form action={startClaimAction}>
              <input type="hidden" name="entityId" value={id} />
              <input type="hidden" name="kind" value={kind} />
              <Button type="submit">Yeniden başvur</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Bu profil sen misin?</CardTitle>
            <CardDescription>
              Başvuru sonrası size bir kod göstereceğiz; bu kodu profilin resmi Instagram hesabından
              @noqt hesabına DM olarak göndermeniz gerekiyor. Ekibimiz DM&apos;i görüp başvurunuzu onaylar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={startClaimAction}>
              <input type="hidden" name="entityId" value={id} />
              <input type="hidden" name="kind" value={kind} />
              <Button type="submit">Sahiplenme başvurusu yap</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
