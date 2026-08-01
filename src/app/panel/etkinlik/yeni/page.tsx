import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { getMyEntities, searchArtists, searchVenues } from "@/lib/panel/queries";
import { createSupplyEventAction } from "@/lib/panel/actions/events";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const fieldsetClass = "space-y-3 rounded-lg border border-border p-4";

export default async function EtkinlikYeniPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const entities = await getMyEntities(user.id);
  if (entities.length === 0) redirect("/panel/sahiplen");

  const sp = await searchParams;
  const asEntityId = sp.as && entities.some((e) => e.entityId === sp.as) ? sp.as : null;

  if (!asEntityId) {
    if (entities.length === 1) redirect(`/panel/etkinlik/yeni?as=${entities[0].entityId}`);
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl">Etkinlik oluştur</h1>
        <p className="text-sm text-muted-foreground">Hangi profil adına oluşturuyorsunuz?</p>
        <div className="space-y-2">
          {entities.map((e) => (
            <Link
              key={e.entityId}
              href={`/panel/etkinlik/yeni?as=${e.entityId}`}
              className="block rounded-lg border border-border p-3 text-sm hover:bg-muted"
            >
              {e.displayName} <span className="text-muted-foreground">({e.kind === "venue" ? "Mekan" : "Sanatçı"})</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const creator = entities.find((e) => e.entityId === asEntityId)!;
  const creatorSide: "venue" | "artist" = creator.kind === "venue" ? "venue" : "artist";

  const [venues, artists] = await Promise.all([
    creatorSide === "artist" ? searchVenues("", 500) : Promise.resolve([]),
    creatorSide === "venue" ? searchArtists("", 500) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Etkinlik oluştur</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {creator.displayName} adına oluşturuyorsunuz.{" "}
          {entities.length > 1 && (
            <Link href="/panel/etkinlik/yeni" className="underline">
              Profil değiştir
            </Link>
          )}
        </p>
      </div>

      <form action={createSupplyEventAction} className="space-y-5">
        <input type="hidden" name="creatorEntityId" value={asEntityId} />

        <div className={fieldsetClass}>
          <div className="space-y-1.5">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" name="title" required placeholder="Örn. Cumartesi Gecesi DJ Set" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startAt">Başlangıç</Label>
              <Input id="startAt" name="startAt" type="datetime-local" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endAt">Bitiş (opsiyonel)</Label>
              <Input id="endAt" name="endAt" type="datetime-local" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">Şehir</Label>
              <select id="city" name="city" defaultValue="Kayseri" className={selectClass}>
                <option value="Kayseri">Kayseri</option>
                <option value="İstanbul">İstanbul</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="district">Semt (opsiyonel)</Label>
              <Input id="district" name="district" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="eventKind">Etkinlik türü</Label>
              <select id="eventKind" name="eventKind" defaultValue="dj" className={selectClass}>
                <option value="dj">DJ</option>
                <option value="live_music">Canlı müzik</option>
                <option value="karaoke">Karaoke</option>
                <option value="quiz">Quiz gecesi</option>
                <option value="theme_night">Tema gecesi</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entryPolicy">Giriş politikası</Label>
              <select id="entryPolicy" name="entryPolicy" defaultValue="" className={selectClass}>
                <option value="">Belirtilmedi</option>
                <option value="free">Ücretsiz</option>
                <option value="door_fee">Kapıda ücret</option>
                <option value="reservation">Rezervasyonlu</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="genres">Tür etiketleri (virgülle ayırın, opsiyonel)</Label>
            <Input id="genres" name="genres" placeholder="house, deep house" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priceText">Fiyat metni (opsiyonel)</Label>
            <Input id="priceText" name="priceText" placeholder="Örn. Kapıda 150₺" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Açıklama (opsiyonel)</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
        </div>

        {creatorSide === "venue" && (
          <div className={fieldsetClass}>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="noArtist" className="mt-0.5" />
              <span>
                Sanatçısız etkinlik (yalnız karaoke / quiz / tema gecesi türleri için — işaretlerseniz
                aşağıdaki sanatçı bilgisi yok sayılır ve etkinlik onay beklemeden yayınlanır).
              </span>
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="artistExistingId">Sanatçı seç</Label>
              <select id="artistExistingId" name="artistExistingId" defaultValue="" className={selectClass}>
                <option value="">— Listeden seç —</option>
                {artists.map((a) => (
                  <option key={a.entity_id} value={a.entity_id}>
                    {a.display_name}
                    {a.city ? ` (${a.city})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-muted-foreground">
              Listede yoksa aşağıya yeni sanatçı bilgisi girin — sistemde sahiplenilmemiş bir profil
              olarak oluşturulur ve sanatçıya davet gönderilir.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="artistNewName">Yeni sanatçı adı</Label>
              <Input id="artistNewName" name="artistNewName" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="artistNewInstagram">Instagram (opsiyonel)</Label>
                <Input id="artistNewInstagram" name="artistNewInstagram" placeholder="@kullaniciadi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="artistNewSpotify">Spotify linki (opsiyonel)</Label>
                <Input id="artistNewSpotify" name="artistNewSpotify" />
              </div>
            </div>
            <p className="text-xs font-medium">Yetkili iletişim (zorunlu — telefon veya e-posta)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="artistContactName">Ad soyad</Label>
                <Input id="artistContactName" name="artistContactName" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="artistContactPhone">Telefon</Label>
                <Input id="artistContactPhone" name="artistContactPhone" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="artistContactEmail">E-posta</Label>
              <Input id="artistContactEmail" name="artistContactEmail" type="email" />
            </div>
          </div>
        )}

        {creatorSide === "artist" && (
          <div className={fieldsetClass}>
            <div className="space-y-1.5">
              <Label htmlFor="venueExistingId">Mekan seç</Label>
              <select id="venueExistingId" name="venueExistingId" defaultValue="" className={selectClass}>
                <option value="">— Listeden seç —</option>
                {venues.map((v) => (
                  <option key={v.entity_id} value={v.entity_id}>
                    {v.name}
                    {v.district ? ` (${v.district})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-muted-foreground">
              Listede yoksa aşağıya yeni mekan bilgisi girin — sistemde sahiplenilmemiş bir profil
              olarak oluşturulur ve mekana davet gönderilir.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="venueNewName">Yeni mekan adı</Label>
              <Input id="venueNewName" name="venueNewName" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueNewInstagram">Instagram (opsiyonel)</Label>
              <Input id="venueNewInstagram" name="venueNewInstagram" placeholder="@kullaniciadi" />
            </div>
            <p className="text-xs font-medium">Yetkili iletişim (zorunlu — telefon veya e-posta)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="venueContactName">Ad soyad</Label>
                <Input id="venueContactName" name="venueContactName" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venueContactPhone">Telefon</Label>
                <Input id="venueContactPhone" name="venueContactPhone" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueContactEmail">E-posta</Label>
              <Input id="venueContactEmail" name="venueContactEmail" type="email" />
            </div>
          </div>
        )}

        <Button type="submit" className="w-full">
          Etkinliği oluştur
        </Button>
      </form>
    </div>
  );
}
