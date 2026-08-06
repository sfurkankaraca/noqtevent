import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { createArtistAdminAction } from "@/lib/panel/actions/admin";
import { PERFORMER_TYPE_LABEL, PERFORMER_TYPE_OPTIONS } from "@/lib/panel/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Kurucu, dışarıdan (Spotify import, sahiplenme başvurusu) henüz gelmemiş
// az bilinen bir sanatçıyı ELLE ekleyebilsin diye (kurucu talebi, bkz.
// createArtistAdminAction yorumu). Alan seti sanatcilar/[id]/page.tsx
// düzenleme formuyla AYNI — yalnız var olan bir entity_id gerektiren
// bölümler (Spotify/YouTube zenginleştirme, medya galerisi, "Yayında"
// anahtarı) burada YOK; kayıt oluşturulduktan sonra düzenleme sayfasında
// eklenir. Slug de yok — sanatçı düzenleme formunda hiç yer almıyor,
// createArtistAdminAction otomatik üretir (bkz. o action'ın yorumu).
export default async function AdminArtistNewPage() {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/panel/admin/sanatcilar" className="text-sm text-muted-foreground hover:underline">
          ← Listeye dön
        </Link>
        <h1 className="mt-1 font-heading text-2xl">Yeni sanatçı ekle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elle eklenen sanatçı doğrudan &quot;Sanatçılar&quot; sekmesinde (onaylı) doğar — potansiyel
          kuyruğuna düşmez. Yayınlamak ayrı, bilinçli bir adım: kaydettikten sonra düzenleme sayfasından
          fotoğraf ekleyip yayına alabilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sanatçı bilgileri</CardTitle>
          <CardDescription>Ad ve tür zorunlu, geri kalanı sonradan da tamamlanabilir.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createArtistAdminAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Görünen ad</Label>
              <Input id="displayName" name="displayName" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" rows={3} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="city">Şehir</Label>
                <Input id="city" name="city" placeholder="Kayseri" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="performerType">Tür</Label>
                <select
                  id="performerType"
                  name="performerType"
                  defaultValue="dj"
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
              <Input id="genres" name="genres" placeholder="rock, pop" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="linkInstagram">Instagram (@ olmadan)</Label>
                <Input id="linkInstagram" name="linkInstagram" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkSpotify">Spotify</Label>
                <Input id="linkSpotify" name="linkSpotify" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkYoutube">YouTube</Label>
                <Input id="linkYoutube" name="linkYoutube" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkSoundcloud">SoundCloud</Label>
                <Input id="linkSoundcloud" name="linkSoundcloud" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit">Oluştur</Button>
              <Link href="/panel/admin/sanatcilar">
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
