import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { createVenueAdminAction } from "@/lib/panel/actions/admin";
import { ENTRY_POLICY_LABEL, ENTRY_POLICY_OPTIONS, VENUE_TYPE_LABEL, VENUE_TYPE_OPTIONS } from "@/lib/panel/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Kurucu, dışarıdan (Google Places import, sahiplenme başvurusu) henüz
// gelmemiş küçük/az bilinen bir mekanı ELLE ekleyebilsin diye (kurucu talebi,
// bkz. createVenueAdminAction yorumu). Alan seti mekanlar/[id]/page.tsx
// düzenleme formuyla AYNI — yalnız var olan bir entity_id gerektiren
// bölümler (takvim görseli, Google zenginleştirme, medya galerisi, "Yayında"
// anahtarı) burada YOK; kayıt oluşturulduktan sonra düzenleme sayfasında
// eklenir.
export default async function AdminVenueNewPage() {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/panel/admin/mekanlar" className="text-sm text-muted-foreground hover:underline">
          ← Listeye dön
        </Link>
        <h1 className="mt-1 font-heading text-2xl">Yeni mekan ekle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elle eklenen mekan doğrudan &quot;Mekanlar&quot; sekmesinde (onaylı) doğar — potansiyel kuyruğuna
          düşmez. Yayınlamak ayrı, bilinçli bir adım: kaydettikten sonra düzenleme sayfasından fotoğraf
          ekleyip yayına alabilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mekan bilgileri</CardTitle>
          <CardDescription>Ad ve şehir zorunlu, geri kalanı sonradan da tamamlanabilir.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createVenueAdminAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Ad</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Adres</Label>
              <Textarea id="address" name="address" rows={2} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" placeholder="orn-mekan-adi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Şehir</Label>
                <Input id="city" name="city" placeholder="Kayseri" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="district">İlçe</Label>
                <Input id="district" name="district" placeholder="Melikgazi" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="venueType">Mekan türü</Label>
                <select
                  id="venueType"
                  name="venueType"
                  defaultValue=""
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
                  defaultValue=""
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
              <Input id="capacity" name="capacity" type="number" min={0} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="instagramHandle">Instagram (@ olmadan)</Label>
                <Input id="instagramHandle" name="instagramHandle" placeholder="mekanadi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="googleMapsPhone">Telefon</Label>
                <Input id="googleMapsPhone" name="googleMapsPhone" placeholder="+90 5xx xxx xx xx" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit">Oluştur</Button>
              <Link href="/panel/admin/mekanlar">
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
