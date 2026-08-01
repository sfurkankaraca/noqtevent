import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getAllArtistsAdmin, getArtistReviewStatusCounts, type ArtistAdminFilters } from "@/lib/panel/adminQueries";
import {
  approveArtistAdminAction,
  archiveArtistAdminAction,
  restoreArtistAdminAction,
  toggleArtistPublishedAction,
} from "@/lib/panel/actions/admin";
import { CLAIM_STATUS_LABEL, PERFORMER_TYPE_LABEL } from "@/lib/panel/format";
import type { ClaimStatus, ReviewStatus } from "@/lib/panel/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TABS: { value: ReviewStatus; label: string }[] = [
  { value: "potential", label: "Potansiyel" },
  { value: "approved", label: "Sanatçılar" },
  { value: "archived", label: "Arşiv" },
];

const CLAIM_STATUS_VALUES: ClaimStatus[] = ["unclaimed", "pending", "claimed", "verified"];

function buildQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v !== "all") usp.set(k, v);
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ sekme?: string; claim?: string; yayin?: string; q?: string; sayfa?: string; kaydedildi?: string }>;
}) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  const sp = await searchParams;
  const reviewStatus: ReviewStatus = sp.sekme === "approved" || sp.sekme === "archived" ? sp.sekme : "potential";
  const claim = (sp.claim as ClaimStatus | undefined) ?? "all";
  const yayin = (sp.yayin as ArtistAdminFilters["published"]) ?? "all";
  const search = sp.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(sp.sayfa ?? "1", 10) || 1);

  const [counts, artistsResult] = await Promise.all([
    getArtistReviewStatusCounts(),
    getAllArtistsAdmin({ reviewStatus, claimStatus: claim, published: reviewStatus === "approved" ? yayin : "all", search, page }),
  ]);
  const { rows: artists, total, pageSize } = artistsResult;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  const filterQs = {
    claim: claim !== "all" ? claim : undefined,
    yayin: yayin !== "all" ? yayin : undefined,
    q: search || undefined,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Sanatçı yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Aynı kürasyon akışı: potansiyel → onayla → yayınla, ya da arşivle.
        </p>
      </div>

      {sp.kaydedildi === "1" && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">Kaydedildi.</div>
      )}

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((tab) => {
          const active = tab.value === reviewStatus;
          const count = counts[tab.value];
          return (
            <Link
              key={tab.value}
              href={`/panel/admin/sanatcilar${buildQuery({ sekme: tab.value === "potential" ? undefined : tab.value, ...filterQs })}`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({count})
            </Link>
          );
        })}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
        <input type="hidden" name="sekme" value={reviewStatus} />
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Sanatçı adı
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Ara..."
            className="h-8 w-48 rounded-lg border border-input bg-transparent px-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Sahiplenme durumu
          <select name="claim" defaultValue={claim} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
            <option value="all">Tümü</option>
            {CLAIM_STATUS_VALUES.map((c) => (
              <option key={c} value={c}>
                {CLAIM_STATUS_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        {reviewStatus === "approved" && (
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Yayın durumu
            <select name="yayin" defaultValue={yayin} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
              <option value="all">Tümü</option>
              <option value="published">Yayında</option>
              <option value="hidden">Gizli</option>
            </select>
          </label>
        )}
        <Button type="submit" size="sm" variant="outline">
          Filtrele
        </Button>
      </form>

      {artists.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bu sekmede sanatçı yok.</p>
      ) : (
        <div className="space-y-3">
          {artists.map((a) => {
            const redirectTo = `/panel/admin/sanatcilar${buildQuery({ sekme: reviewStatus, ...filterQs, sayfa: page > 1 ? String(page) : undefined })}`;
            return (
              <Card key={a.entity_id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {a.display_name}
                    {reviewStatus === "approved" && (
                      <Badge variant={a.is_published ? "default" : "outline"}>{a.is_published ? "Yayında" : "Gizli"}</Badge>
                    )}
                    <Badge variant="outline">{CLAIM_STATUS_LABEL[a.claim_status]}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {[PERFORMER_TYPE_LABEL[a.performer_type as keyof typeof PERFORMER_TYPE_LABEL] ?? a.performer_type, a.city]
                      .filter(Boolean)
                      .join(" · ")}
                    {a.links.instagram && <> · @{a.links.instagram}</>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Link href={`/panel/admin/sanatcilar/${a.entity_id}?redirectTo=${encodeURIComponent(redirectTo)}`}>
                    <Button type="button" size="sm" variant="outline">
                      Düzenle
                    </Button>
                  </Link>

                  {reviewStatus === "potential" && (
                    <>
                      <form action={approveArtistAdminAction}>
                        <input type="hidden" name="entityId" value={a.entity_id} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <Button type="submit" size="sm">
                          Onayla
                        </Button>
                      </form>
                      <details>
                        <summary className="cursor-pointer text-sm text-destructive">Arşivle</summary>
                        <form action={archiveArtistAdminAction} className="mt-2">
                          <input type="hidden" name="entityId" value={a.entity_id} />
                          <input type="hidden" name="redirectTo" value={redirectTo} />
                          <Button type="submit" size="sm" variant="destructive">
                            Arşivlemeyi onayla
                          </Button>
                        </form>
                      </details>
                    </>
                  )}

                  {reviewStatus === "approved" && (
                    <>
                      <form action={toggleArtistPublishedAction}>
                        <input type="hidden" name="entityId" value={a.entity_id} />
                        <input type="hidden" name="nextValue" value={(!a.is_published).toString()} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <Button type="submit" size="sm" variant={a.is_published ? "outline" : "default"}>
                          {a.is_published ? "Gizle" : "Yayınla"}
                        </Button>
                      </form>
                      <details>
                        <summary className="cursor-pointer text-sm text-destructive">Arşivle</summary>
                        <form action={archiveArtistAdminAction} className="mt-2">
                          <input type="hidden" name="entityId" value={a.entity_id} />
                          <input type="hidden" name="redirectTo" value={redirectTo} />
                          <Button type="submit" size="sm" variant="destructive">
                            Arşivlemeyi onayla
                          </Button>
                        </form>
                      </details>
                    </>
                  )}

                  {reviewStatus === "archived" && (
                    <>
                      <form action={restoreArtistAdminAction}>
                        <input type="hidden" name="entityId" value={a.entity_id} />
                        <input type="hidden" name="target" value="potential" />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <Button type="submit" size="sm" variant="outline">
                          Potansiyele Taşı
                        </Button>
                      </form>
                      <form action={restoreArtistAdminAction}>
                        <input type="hidden" name="entityId" value={a.entity_id} />
                        <input type="hidden" name="target" value="approved" />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <Button type="submit" size="sm">
                          Onayla
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {total > pageSize && (
        <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
          <span>
            {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total} sanatçı
          </span>
          <div className="flex gap-2">
            <Link
              href={`/panel/admin/sanatcilar${buildQuery({ sekme: reviewStatus, ...filterQs, sayfa: page > 2 ? String(page - 1) : undefined })}`}
              aria-disabled={page <= 1}
              className={`rounded-lg border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
            >
              ‹ Önceki
            </Link>
            <span className="px-2 py-1.5">
              Sayfa {page} / {lastPage}
            </span>
            <Link
              href={`/panel/admin/sanatcilar${buildQuery({ sekme: reviewStatus, ...filterQs, sayfa: String(page + 1) })}`}
              aria-disabled={page >= lastPage}
              className={`rounded-lg border px-3 py-1.5 ${page >= lastPage ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
            >
              Sonraki ›
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
