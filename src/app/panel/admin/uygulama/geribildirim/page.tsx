import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { listFeedbackAdmin, getFeedbackStatusCounts, FEEDBACK_STATUSES } from "@/lib/panel/appAdminQueries";
import { setFeedbackStatusAdminAction } from "@/lib/panel/actions/appAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<(typeof FEEDBACK_STATUSES)[number], string> = {
  new: "Yeni",
  triaged: "İnceleniyor",
  done: "Tamamlandı",
};

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function AppAdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ sekme?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const sp = await searchParams;
  const status: (typeof FEEDBACK_STATUSES)[number] =
    sp.sekme === "triaged" || sp.sekme === "done" ? sp.sekme : "new";

  const [counts, entries] = await Promise.all([getFeedbackStatusCounts(), listFeedbackAdmin(status)]);
  const redirectTo = `/panel/admin/uygulama/geribildirim?sekme=${status}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Uygulama — Geri bildirim</h1>
        <p className="text-sm text-muted-foreground">eventmatch Firestore feedback koleksiyonu.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {FEEDBACK_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/panel/admin/uygulama/geribildirim?sekme=${s}`}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              s === status ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {STATUS_LABEL[s]} ({counts[s]})
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bu durumda geri bildirim yok.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((f) => (
            <Card key={f.id}>
              <CardHeader>
                <CardTitle className="text-base">{f.category}</CardTitle>
                <CardDescription>
                  {f.appVersion} · {f.platform} · {formatDate(f.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{f.message}</p>
                {f.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-only, tek seferlik köprü (next/image remotePatterns'a Firebase Storage eklemeye değmez)
                  <img
                    src={f.imageUrl}
                    alt="Geri bildirim eki"
                    className="max-h-64 rounded-lg border object-contain"
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_STATUSES.filter((s) => s !== f.status).map((s) => (
                    <form key={s} action={setFeedbackStatusAdminAction}>
                      <input type="hidden" name="feedbackId" value={f.id} />
                      <input type="hidden" name="status" value={s} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <Button type="submit" size="sm" variant="outline">
                        {STATUS_LABEL[s]} olarak işaretle
                      </Button>
                    </form>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
