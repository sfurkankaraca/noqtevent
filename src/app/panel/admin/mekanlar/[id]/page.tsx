import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getConfirmedEventsForEntityInRange, getVenueByEntityId } from "@/lib/panel/queries";
import { updateVenueAdminAction } from "@/lib/panel/actions/admin";
import { CLAIM_STATUS_LABEL, ENTRY_POLICY_LABEL, ENTRY_POLICY_OPTIONS, REVIEW_STATUS_LABEL, VENUE_TYPE_LABEL, VENUE_TYPE_OPTIONS } from "@/lib/panel/format";
import { getMonthRange, getWeekRange } from "@/lib/panel/gorsel/period";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ImageOptionsControls } from "../../../ImageOptionsControls";

export default async function AdminVenueEditPage({
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
  const venue = await getVenueByEntityId(id);
  if (!venue) notFound();

  const listRedirectTo = sp.redirectTo ?? "/panel/admin/mekanlar";
  const isPublishEditable = venue.review_status === "approved";

  // Kurucu, mekan adına takvim görseli üretebilsin — lansman öncesi davet
  // mesajlarına eklemek için (kurucu talebi, "KAPSAM EKLEMESİ" §4).
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();
  const [weekCount, monthCount] = await Promise.all([
    getConfirmedEventsForEntityInRange(venue.entity_id, weekRange.startIso, weekRange.endIso).then((r) => r.length),
    getConfirmedEventsForEntityInRange(venue.entity_id, monthRange.startIso, monthRange.endIso).then((r) => r.length),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={listRedirectTo} className="text-sm text-muted-foreground hover:underline">
          ← Listeye dön
        </Link>
        <h1 className="mt-1 font-heading text-2xl">{venue.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{REVIEW_STATUS_LABEL[venue.review_status]}</Badge>
          <Badge variant="outline">{CLAIM_STATUS_LABEL[venue.claim_status]}</Badge>
          {venue.review_status === "approved" && (
            <Badge variant={venue.is_published ? "default" : "outline"}>{venue.is_published ? "Yayında" : "Gizli"}</Badge>
          )}
        </div>
      </div>

      {sp.kaydedildi === "1" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Kaydedildi.</div>
      )}

      {venue.review_status !== "approved" && (
        <p className="rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
          Bu mekan henüz onaylı değil ({REVIEW_STATUS_LABEL[venue.review_status]}) — yayın açma/kapama burada
          gösterilmiyor, çünkü veritabanı yalnız onaylı mekanların yayınlanmasına izin veriyor. Önce mekan
          listesinden onaylayın.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Takvim görseli</CardTitle>
          <CardDescription>
            Mekanın bu haftaki / bu aydaki onaylı etkinliklerini tek görselde paylaşın (davet mesajlarına eklemek için).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Haftalık</p>
            <ImageOptionsControls
              basePath={`/panel/takvim/gorsel?entityId=${venue.entity_id}&period=week`}
              disabled={weekCount === 0}
              disabledReason="Bu hafta onaylı etkinlik yok."
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Aylık</p>
            <ImageOptionsControls
              basePath={`/panel/takvim/gorsel?entityId=${venue.entity_id}&period=month`}
              disabled={monthCount === 0}
              disabledReason="Bu ay (bugünden itibaren) onaylı etkinlik yok."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mekan bilgileri</CardTitle>
          <CardDescription>Web araştırmasıyla toplanan bilgiler — yayınlamadan önce doğrulayın.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateVenueAdminAction} className="space-y-4">
            <input type="hidden" name="entityId" value={venue.entity_id} />
            <input type="hidden" name="listRedirectTo" value={listRedirectTo} />
            {isPublishEditable && <input type="hidden" name="isPublishedEditable" value="true" />}

            <div className="space-y-1.5">
              <Label htmlFor="name">Ad</Label>
              <Input id="name" name="name" defaultValue={venue.name} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Adres</Label>
              <Textarea id="address" name="address" defaultValue={venue.address ?? ""} rows={2} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={venue.slug ?? ""} placeholder="orn-mekan-adi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district">İlçe</Label>
                <Input id="district" name="district" defaultValue={venue.district ?? ""} placeholder="Melikgazi" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="venueType">Mekan türü</Label>
                <select
                  id="venueType"
                  name="venueType"
                  defaultValue={venue.venue_type ?? ""}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Seçilmedi</option>
                  {VENUE_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {VENUE_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entryPolicy">Giriş politikası</Label>
                <select
                  id="entryPolicy"
                  name="entryPolicy"
                  defaultValue={venue.entry_policy ?? ""}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Seçilmedi</option>
                  {ENTRY_POLICY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {ENTRY_POLICY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity">Kapasite</Label>
              <Input id="capacity" name="capacity" type="number" min={0} defaultValue={venue.capacity ?? ""} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="instagramHandle">Instagram (@ olmadan)</Label>
                <Input id="instagramHandle" name="instagramHandle" defaultValue={venue.instagram_handle ?? ""} placeholder="mekanadi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="googleMapsPhone">Telefon</Label>
                <Input id="googleMapsPhone" name="googleMapsPhone" defaultValue={venue.google_maps_phone ?? ""} placeholder="+90 5xx xxx xx xx" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="photoUrls">Fotoğraf URL&apos;leri (her satıra bir tane)</Label>
              <Textarea id="photoUrls" name="photoUrls" defaultValue={venue.photo_urls.join("\n")} rows={3} />
            </div>

            {isPublishEditable && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublished" defaultChecked={venue.is_published} className="h-4 w-4" />
                Yayında (herkese açık keşif akışında görünsün)
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
