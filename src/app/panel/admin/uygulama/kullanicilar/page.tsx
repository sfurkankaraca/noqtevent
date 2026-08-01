import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { listUsersAdmin } from "@/lib/panel/appAdminQueries";
import { toggleUserBannedAdminAction, deleteAppUserAdminAction } from "@/lib/panel/actions/appAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function AppAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string; silindi?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const sp = await searchParams;
  const search = sp.q?.trim() ?? "";
  const cursorId = sp.cursor ?? null;

  const { rows: users, nextCursorId } = await listUsersAdmin({ search, cursorId });

  const redirectTo = `/panel/admin/uygulama/kullanicilar${search ? `?q=${encodeURIComponent(search)}` : cursorId ? `?cursor=${encodeURIComponent(cursorId)}` : ""}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Uygulama — Kullanıcılar</h1>
        <p className="text-sm text-muted-foreground">eventmatch Firestore users koleksiyonu — en yeni üstte.</p>
      </div>

      {sp.silindi === "1" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Hesap silindi.</div>
      )}

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Ad veya UID
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Ara..."
            className="h-8 w-64 rounded-lg border border-input bg-transparent px-2 text-sm"
          />
        </label>
        <Button type="submit" size="sm" variant="outline">
          Ara
        </Button>
        {search && (
          <Link href="/panel/admin/uygulama/kullanicilar" className="text-sm text-muted-foreground hover:underline">
            Aramayı temizle
          </Link>
        )}
      </form>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kullanıcı bulunamadı.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {u.name}
                  {u.isBot && <Badge variant="outline">bot</Badge>}
                  {u.verified && <Badge>Doğrulanmış</Badge>}
                  {u.premiumTier === "gold" && <Badge variant="secondary">Gold</Badge>}
                  {u.banned && <Badge variant="destructive">Blackliste</Badge>}
                </CardTitle>
                <CardDescription>
                  {[u.city, formatDate(u.createdAt)].filter(Boolean).join(" · ")} · <span className="font-mono">{u.id}</span>
                </CardDescription>
              </CardHeader>
              {!u.isBot && (
                <CardContent className="flex flex-wrap items-center gap-2">
                  <form action={toggleUserBannedAdminAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="nextValue" value={(!u.banned).toString()} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <Button type="submit" size="sm" variant={u.banned ? "outline" : "destructive"}>
                      {u.banned ? "Blacklistten Çıkar" : "Blackliste Al"}
                    </Button>
                  </form>
                  <details>
                    <summary className="cursor-pointer text-sm text-destructive">Hesabı Sil</summary>
                    <form action={deleteAppUserAdminAction} className="mt-2 space-y-2">
                      <p className="max-w-sm text-xs text-muted-foreground">
                        {u.name} adlı kullanıcının hesabı, eşleşmeleri, mesajları ve profili KALICI olarak
                        silinecek. Bu işlem geri alınamaz.
                      </p>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <Button type="submit" size="sm" variant="destructive">
                        Silmeyi onayla
                      </Button>
                    </form>
                  </details>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {!search && nextCursorId && (
        <div className="flex justify-end border-t pt-3">
          <Link
            href={`/panel/admin/uygulama/kullanicilar?cursor=${encodeURIComponent(nextCursorId)}`}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Sonraki 50 ›
          </Link>
        </div>
      )}
    </div>
  );
}
