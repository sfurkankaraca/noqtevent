import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { getMyEntities } from "@/lib/panel/queries";
import { submitOnboardingSurveyAction } from "@/lib/panel/actions/onboarding";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RoleSide } from "@/lib/panel/types";

const QUESTIONS: Record<RoleSide, { key: string; label: string }[]> = {
  venue: [
    { key: "duyuru_derdi", label: "Etkinlik duyurusunda en büyük derdiniz nedir?" },
    { key: "rezervasyon_yontemi", label: "Rezervasyonu şu an nasıl alıyorsunuz? (DM/telefon/defter/başka)" },
    { key: "haftalik_etkinlik", label: "Haftada kaç etkinlik düzenliyorsunuz?" },
    { key: "sanatci_bulma", label: "Sanatçıyı nasıl buluyorsunuz?" },
  ],
  artist: [
    { key: "sahne_bulma", label: "Sahne bulmayı nasıl yapıyorsunuz?" },
    { key: "anlasma_sorunu", label: "Anlaşma/ödeme sürecinde en büyük sorununuz nedir?" },
  ],
  manager: [
    { key: "sanatci_sayisi", label: "Kaç sanatçı yönetiyorsunuz?" },
    { key: "en_cok_zaman", label: "En çok zaman yiyen iş nedir?" },
  ],
};

export default async function AnketPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const entities = await getMyEntities(user.id);
  const sp = await searchParams;
  const entity = entities.find((e) => e.entityId === sp.entity) ?? entities[0];

  if (!entity) redirect("/panel/sahiplen");

  const roleSide: RoleSide = entity.kind === "venue" ? "venue" : entity.memberRole === "manager" ? "manager" : "artist";
  const questions = QUESTIONS[roleSide];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Kısa anket</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {entity.displayName} için, tamamen opsiyonel — yol haritamızı şekillendiriyor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{questions.length} soru</CardTitle>
          <CardDescription>Dilediğinizi boş bırakabilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitOnboardingSurveyAction} className="space-y-4">
            <input type="hidden" name="entityId" value={entity.entityId} />
            <input type="hidden" name="roleSide" value={roleSide} />
            {questions.map((q) => (
              <div key={q.key} className="space-y-1.5">
                <Label htmlFor={q.key}>{q.label}</Label>
                <Textarea id={q.key} name={`q_${q.key}`} rows={2} />
              </div>
            ))}
            <Button type="submit">Gönder</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
