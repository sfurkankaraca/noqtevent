import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { listPendingVerificationsAdmin } from "@/lib/panel/appAdminQueries";
import { safeAdminCall } from "@/lib/panel/appAdminBridge";
import { reviewVerificationAdminAction } from "@/lib/panel/actions/appAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminBridgeError } from "@/components/panel/AdminBridgeError";

// eventmatch (Firestore) `verificationRequests` koleksiyonunun web karşılığı —
// lib/screens/verification_review_screen.dart ile aynı mantık: selfie + profil
// fotoğrafı yan yana, Onayla/Reddet. Karar doğrudan Firestore'a yazılır (bkz.
// appAdminQueries.ts::reviewVerificationAdmin başındaki not — eventmatch
// tarafında da bu bir Cloud Function değil, rules'ta isFounder() ile korunan
// doğrudan bir yazım).
//
// SELFIE'LER SİLİNİYOR: 2026-08-06 güvenlik denetiminden sonra doğrulama
// selfie'leri incelemeden SONRA otomatik siliniyor (verification-cleanup.ts
// tetikleyicisi) — bu yüzden fotoğraf yalnız hâlâ BEKLEYEN kayıtlarda var
// olabilir; aşağıdaki listede zaten yalnız status=pending kayıtlar var.

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AppAdminVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ islendi?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const sp = await searchParams;
  const result = await safeAdminCall(() => listPendingVerificationsAdmin());

  if (!result.ok) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl">Uygulama — Kimlik doğrulama</h1>
          <p className="text-sm text-muted-foreground">
            eventmatch Firestore verificationRequests koleksiyonu — status=pending.
          </p>
        </div>
        <AdminBridgeError error={result.error} />
      </div>
    );
  }
  const requests = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Uygulama — Kimlik doğrulama</h1>
        <p className="text-sm text-muted-foreground">
          eventmatch Firestore verificationRequests koleksiyonu — status=pending.
        </p>
      </div>

      {sp.islendi === "1" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Karar kaydedildi.</div>
      )}

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bekleyen istek yok.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.uid}>
              <CardHeader>
                <CardTitle className="text-base">{req.name}</CardTitle>
                <CardDescription>
                  <span className="font-mono">{req.uid}</span> · {formatDate(req.requestedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    {req.profileImageDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin-only, base64 gömülü (imzalı URL değil, Storage yolu token'sız)
                      <img
                        src={req.profileImageDataUrl}
                        alt="Profil fotoğrafı"
                        className="h-40 w-full rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                        Fotoğraf yok
                      </div>
                    )}
                    <p className="text-center text-xs text-muted-foreground">Profil fotoğrafı</p>
                  </div>
                  <div className="space-y-1">
                    {req.selfieDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin-only, base64 gömülü (imzalı URL değil, Storage yolu token'sız)
                      <img
                        src={req.selfieDataUrl}
                        alt="Doğrulama selfie'si"
                        className="h-40 w-full rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                        Selfie okunamadı
                      </div>
                    )}
                    <p className="text-center text-xs text-muted-foreground">Doğrulama selfie&apos;si</p>
                  </div>
                </div>

                <div className="flex gap-2 border-t pt-3">
                  <form action={reviewVerificationAdminAction} className="flex-1">
                    <input type="hidden" name="uid" value={req.uid} />
                    <input type="hidden" name="approve" value="false" />
                    <Button type="submit" size="sm" variant="outline" className="w-full text-destructive">
                      Reddet
                    </Button>
                  </form>
                  <form action={reviewVerificationAdminAction} className="flex-1">
                    <input type="hidden" name="uid" value={req.uid} />
                    <input type="hidden" name="approve" value="true" />
                    <Button type="submit" size="sm" className="w-full">
                      Onayla
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
