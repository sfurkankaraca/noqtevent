import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { listOpenReportsAdmin } from "@/lib/panel/appAdminQueries";
import { safeAdminCall } from "@/lib/panel/appAdminBridge";
import { moderateReportAdminAction } from "@/lib/panel/actions/appAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminBridgeError } from "@/components/panel/AdminBridgeError";

// eventmatch (Firestore) `reports` koleksiyonunun web karşılığı —
// lib/screens/admin_reports_screen.dart ile aynı mantık. Moderasyon KARARI
// (askıya al / içeriği kaldır) burada YAZILMAZ: moderateReportAdminAction
// eventmatch'in moderateReport Cloud Function'ını çağırır — sahiplik/kanıt
// doğrulaması yalnız orada yapılıyor (bkz. src/lib/panel/eventmatchAdminApi.ts
// başındaki not). Doğrulanamayan bir ban denendiğinde sunucu 409 döner; bu
// sayfa o durumu `uyari=1` query param'larıyla banner olarak gösterir —
// Flutter'daki `_confirmUnverified` diyaloğunun web karşılığı.

function unverifiedReasonText(reason: string | undefined): string {
  switch (reason) {
    case "no_content_evidence":
      return "Bu şikayet bir içeriğe bağlı değil (profil veya sohbet şikayeti), bu yüzden sunucu şikayetin doğruluğunu DOĞRULAYAMIYOR. Şikayet edilen kişinin gerçekten kural ihlali yaptığını başka bir yoldan teyit ettiysen devam edebilirsin.";
    case "content_not_found":
      return "Şikayete konu içerik artık yok (hikâyeler 24 saat sonra otomatik siliniyor). Kanıt süresi dolduğu için doğrulama yapılamıyor.";
    case "content_owner_mismatch":
      return "Şikayetteki içerik bu kullanıcıya AİT DEĞİL — şikayet kendi içinde tutarsız, sahte olabilir. Yine de askıya almak gerekiyorsa Kullanıcılar ekranından yap.";
    case "unsafe_content_path":
      return "Şikayetteki içerik yolu geçersiz — şikayet elle üretilmiş olabilir. Yine de askıya almak gerekiyorsa Kullanıcılar ekranından yap.";
    default:
      return "Sunucu bu şikayeti doğrulayamadı.";
  }
}

export default async function AppAdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ islendi?: string; uyari?: string; reportId?: string; reason?: string; requiresForce?: string; targetExists?: string; contentPath?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const sp = await searchParams;
  const result = await safeAdminCall(() => listOpenReportsAdmin());

  const warningForReportId = sp.uyari === "1" ? sp.reportId : null;
  const requiresForce = sp.requiresForce === "true";

  if (!result.ok) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl">Uygulama — Şikayetler</h1>
          <p className="text-sm text-muted-foreground">eventmatch Firestore reports koleksiyonu — status=new, en yeni üstte.</p>
        </div>
        <AdminBridgeError error={result.error} />
      </div>
    );
  }
  const reports = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Uygulama — Şikayetler</h1>
        <p className="text-sm text-muted-foreground">eventmatch Firestore reports koleksiyonu — status=new, en yeni üstte.</p>
      </div>

      {sp.islendi === "1" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Şikayet işlendi.</div>
      )}

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bekleyen şikayet yok — temiz.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className={r.urgent ? "border-destructive" : undefined}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {r.reason}
                  {r.hoursAgo !== null && (
                    <span className={`text-xs font-normal ${r.urgent ? "text-destructive" : "text-muted-foreground"}`}>
                      {r.hoursAgo} sa önce
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Kaynak: {r.source}
                  {r.contentId && (
                    <>
                      {" · "}
                      <span className="font-mono">{r.contentId}</span>
                    </>
                  )}
                  {" · "}
                  <span className="font-mono">{r.reportedUserId || "?"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!r.contentId && (
                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                    İçerik kanıtı yok — hedef içerikle doğrulanamaz
                  </Badge>
                )}
                {r.contentPreview && (
                  <p className="text-sm text-muted-foreground italic">
                    Şikayetçinin ilettiği metin (doğrulanmamış): &quot;{r.contentPreview}&quot;
                  </p>
                )}

                {warningForReportId === r.id && (
                  <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-400">Hedef içerikle doğrulanamadı</p>
                    <p className="text-muted-foreground">{unverifiedReasonText(sp.reason)}</p>
                    {sp.targetExists === "false" && (
                      <p className="text-xs text-muted-foreground">
                        Not: bu kullanıcının profil belgesi yok (silinmiş olabilir); askıya alma kaydı yine de yazılır.
                      </p>
                    )}
                    {sp.contentPath && (
                      <p className="text-xs text-muted-foreground">
                        Kontrol edilen belge: <span className="font-mono">{sp.contentPath}</span>
                      </p>
                    )}
                    {requiresForce ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Devam edersen bu ban &quot;doğrulanmamış&quot; olarak şikayet kaydına işlenir.
                        </p>
                        <form action={moderateReportAdminAction}>
                          <input type="hidden" name="reportId" value={r.id} />
                          <input type="hidden" name="action" value="ban" />
                          <input type="hidden" name="force" value="true" />
                          <Button type="submit" size="sm" variant="destructive">
                            Yine de askıya al
                          </Button>
                        </form>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Bu şikayet onayla bile askıya alınamaz — gerekiyorsa Kullanıcılar ekranından doğrudan
                        askıya al.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                  {r.contentId && (
                    <form action={moderateReportAdminAction}>
                      <input type="hidden" name="reportId" value={r.id} />
                      <input type="hidden" name="action" value="remove_content" />
                      <Button type="submit" size="sm" variant="destructive">
                        İçeriği kaldır
                      </Button>
                    </form>
                  )}
                  {r.reportedUserId && (
                    <form action={moderateReportAdminAction}>
                      <input type="hidden" name="reportId" value={r.id} />
                      <input type="hidden" name="action" value="ban" />
                      <Button type="submit" size="sm" variant="destructive">
                        Askıya al
                      </Button>
                    </form>
                  )}
                  <form action={moderateReportAdminAction} className="ml-auto">
                    <input type="hidden" name="reportId" value={r.id} />
                    <input type="hidden" name="action" value="review" />
                    <Button type="submit" size="sm" variant="outline">
                      İncelendi
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
