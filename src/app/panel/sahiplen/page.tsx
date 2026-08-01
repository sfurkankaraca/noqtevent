import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { searchArtists, searchVenues } from "@/lib/panel/queries";
import { CLAIM_STATUS_LABEL } from "@/lib/panel/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "../LinkButton";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function SahiplenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tur?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const sp = await searchParams;
  const query = sp.q ?? "";
  const tur = sp.tur === "sanatci" ? "sanatci" : "mekan";

  const results = tur === "mekan" ? await searchVenues(query) : await searchArtists(query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Profilini sahiplen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mekanınızı ya da sanatçı profilinizi bulun, sahiplenme başvurusu yapın. Doğrulama resmi
          Instagram hesabınızdan gönderilecek bir kod ile yapılır.
        </p>
      </div>

      <form method="GET" className="flex flex-col gap-3 sm:flex-row">
        <select name="tur" defaultValue={tur} className={`${selectClass} sm:w-40`}>
          <option value="mekan">Mekan</option>
          <option value="sanatci">Sanatçı</option>
        </select>
        <Input name="q" defaultValue={query} placeholder="Adıyla ara…" className="flex-1" />
        <Button type="submit">Ara</Button>
      </form>

      <div className="space-y-3">
        {results.length === 0 && (
          <p className="text-sm text-muted-foreground">Sonuç bulunamadı. Aramayı değiştirin.</p>
        )}
        {tur === "mekan" &&
          results.map((r) => {
            const v = r as Awaited<ReturnType<typeof searchVenues>>[number];
            return (
              <Card key={v.entity_id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{v.name}</CardTitle>
                    <Badge variant="outline">{CLAIM_STATUS_LABEL[v.claim_status]}</Badge>
                  </div>
                  {v.district && <CardDescription>{v.district}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <LinkButton href={`/panel/sahiplen/venue/${v.entity_id}`} size="sm">
                    Detay / Sahiplen
                  </LinkButton>
                </CardContent>
              </Card>
            );
          })}
        {tur === "sanatci" &&
          results.map((r) => {
            const a = r as Awaited<ReturnType<typeof searchArtists>>[number];
            return (
              <Card key={a.entity_id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{a.display_name}</CardTitle>
                    <Badge variant="outline">{CLAIM_STATUS_LABEL[a.claim_status]}</Badge>
                  </div>
                  {a.city && <CardDescription>{a.city}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <LinkButton href={`/panel/sahiplen/artist/${a.entity_id}`} size="sm">
                    Detay / Sahiplen
                  </LinkButton>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
