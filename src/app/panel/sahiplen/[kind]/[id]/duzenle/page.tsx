import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { isEntityMember, getArtistByEntityId, getVenueByEntityId } from "@/lib/panel/queries";
import { updateOwnMediaAction } from "@/lib/panel/actions/selfServe";
import { Button } from "@/components/ui/button";
import MediaManager from "@/components/panel/MediaManager";

// Sahiplenmiş mekan/sanatçı sahibinin KENDİ fotoğraf/videosunu yönettiği
// ekran (kurucu kararı, 2026-08-07: video yükleme yalnız admin panelinde
// değil, sahiplenen kişiye de açık olsun). Kasıtlı olarak DAR kapsamlı —
// yalnız medya; isim/adres/yayın durumu değiştirilemez (bkz.
// lib/panel/actions/selfServe.ts başlığı).
export default async function OwnMediaEditPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const { kind, id } = await params;
  if (kind !== "venue" && kind !== "artist") notFound();

  const admin = await isPanelAdmin();
  if (!admin) {
    const member = await isEntityMember(user.id, id, ["owner", "manager"]);
    if (!member) redirect(`/panel/sahiplen/${kind}/${id}`);
  }

  const profile = kind === "venue" ? await getVenueByEntityId(id) : await getArtistByEntityId(id);
  if (!profile) notFound();

  const name = kind === "venue" ? (profile as { name: string }).name : (profile as { display_name: string }).display_name;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/panel/sahiplen/${kind}/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Profile dön
        </Link>
        <h1 className="mt-1 font-heading text-2xl">{name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fotoğraf ve video yönetimi. Diğer profil bilgileri (isim, adres, yayın durumu) için ekibimizle iletişime geçin.
        </p>
      </div>

      <form action={updateOwnMediaAction} className="space-y-4">
        <input type="hidden" name="entityId" value={id} />
        <input type="hidden" name="kind" value={kind} />

        <MediaManager
          entityId={id}
          kind={kind}
          initialCoverUrl={kind === "artist" ? (profile as { photo_url: string | null }).photo_url ?? "" : ""}
          initialGalleryUrls={profile.photo_urls}
          initialVideoUrls={profile.video_urls}
          initialVideoAssets={profile.video_assets}
        />

        <Button type="submit">Kaydet</Button>
      </form>
    </div>
  );
}
