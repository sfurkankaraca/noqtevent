import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getArtistByEntityId } from "@/lib/panel/queries";
import { updateArtistAdminAction } from "@/lib/panel/actions/admin";
import { CLAIM_STATUS_LABEL, PERFORMER_TYPE_LABEL, PERFORMER_TYPE_OPTIONS, REVIEW_STATUS_LABEL } from "@/lib/panel/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import MediaManager from "@/components/panel/MediaManager";
import ArtistEnrich from "@/components/panel/ArtistEnrich";

export default async function AdminArtistEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ redirectTo?: string; kaydedildi?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const { id } = await params;
  const sp = await searchParams;
  const artist = await getArtistByEntityId(id);
  if (!artist) notFound();

  const listRedirectTo = sp.redirectTo ?? "/panel/admin/sanatcilar";
  const isPublishEditable = artist.review_status === "approved";

  return (
    <div className="space-y-6">
      <div>
        <Link href={listRedirectTo} className="text-sm text-muted-foreground hover:underline">
          ← Listeye dön
        </Link>
        <h1 className="mt-1 font-heading text-2xl">{artist.display_name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{REVIEW_STATUS_LABEL[artist.review_status]}</Badge>
          <Badge variant="outline">{CLAIM_STATUS_LABEL[artist.claim_status]}</Badge>
          {artist.review_status === "approved" && (
            <Badge variant={artist.is_published ? "default" : "outline"}>{artist.is_published ? "Yayında" : "Gizli"}</Badge>
          )}
        </div>
      </div>

      {sp.kaydedildi === "1" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Kaydedildi.</div>
      )}

      {artist.review_status !== "approved" && (
        <p className="rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
          Bu sanatçı henüz onaylı değil ({REVIEW_STATUS_LABEL[artist.review_status]}) — yayın açma/kapama burada
          gösterilmiyor. Önce sanatçı listesinden onaylayın.
        </p>
      )}

      <ArtistEnrich
        entityId={artist.entity_id}
        spotifyArtistId={artist.spotify_artist_id}
        spotifyPopularity={artist.spotify_popularity}
        spotifyFollowers={artist.spotify_followers}
        enrichedAt={artist.enriched_at}
        youtubeChannelId={artist.youtube_channel_id}
        videoUrls={artist.video_urls}
      />

      <Card>
        <CardHeader>
          <CardTitle>Sanatçı bilgileri</CardTitle>
          <CardDescription>{PERFORMER_TYPE_LABEL[artist.performer_type as keyof typeof PERFORMER_TYPE_LABEL] ?? artist.performer_type}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateArtistAdminAction} className="space-y-4">
            <input type="hidden" name="entityId" value={artist.entity_id} />
            <input type="hidden" name="listRedirectTo" value={listRedirectTo} />
            {isPublishEditable && <input type="hidden" name="isPublishedEditable" value="true" />}

            <div className="space-y-1.5">
              <Label htmlFor="displayName">Görünen ad</Label>
              <Input id="displayName" name="displayName" defaultValue={artist.display_name} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" defaultValue={artist.bio ?? ""} rows={3} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="city">Şehir</Label>
                <Input id="city" name="city" defaultValue={artist.city ?? ""} placeholder="Kayseri" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="performerType">Tür</Label>
                <select
                  id="performerType"
                  name="performerType"
                  defaultValue={artist.performer_type}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  {PERFORMER_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {PERFORMER_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="genres">Türler (virgülle ayır)</Label>
              <Input id="genres" name="genres" defaultValue={artist.genres.join(", ")} placeholder="rock, pop" />
            </div>

            <MediaManager
              entityId={artist.entity_id}
              kind="artist"
              initialCoverUrl={artist.photo_url ?? ""}
              initialGalleryUrls={artist.photo_urls}
              initialVideoUrls={artist.video_urls}
              initialVideoAssets={artist.video_assets}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="linkInstagram">Instagram (@ olmadan)</Label>
                <Input id="linkInstagram" name="linkInstagram" defaultValue={artist.links.instagram ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkSpotify">Spotify</Label>
                <Input id="linkSpotify" name="linkSpotify" defaultValue={artist.links.spotify ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkYoutube">YouTube</Label>
                <Input id="linkYoutube" name="linkYoutube" defaultValue={artist.links.youtube ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkSoundcloud">SoundCloud</Label>
                <Input id="linkSoundcloud" name="linkSoundcloud" defaultValue={artist.links.soundcloud ?? ""} />
              </div>
            </div>

            {isPublishEditable && (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="isPublished" defaultChecked={artist.is_published} className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Yayında (herkese açık keşif akışında görünsün)</span>
              </label>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit">Kaydet</Button>
              <Link href={listRedirectTo}>
                <Button type="button" variant="outline">
                  Vazgeç
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
