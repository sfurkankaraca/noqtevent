"use client";

// Google Places otomatik zenginleştirme — mekan düzenleme sayfasının
// (src/app/panel/admin/mekanlar/[id]/page.tsx) form Card'ının ÜSTÜNDE ayrı
// bir Card olarak render edilir. src/components/panel/ArtistEnrich.tsx'in
// (sanatçı/Spotify) BİREBİR AYNI deseni: kendi fetch çağrılarıyla doğrudan
// DB'ye yazar (bkz. /api/panel/enrich/venue-google-*), sonra
// router.refresh() ile server component'i yeniden render ettirip sayfanın
// üst kısmındaki puan/foto bilgisini tazeler.
//
// NOT: MediaManager'ın galeri state'i (initialGalleryUrls) mount anında
// alınan bir başlangıç değeridir — router.refresh() bu iç state'i otomatik
// TAZELEMEZ (mevcut, bu bileşenden bağımsız bir davranış). "Uygula" ile
// eklenen Google fotoğrafları veritabanına yazılır ve sayfa yeniden
// yüklendiğinde (F5) galeri de görünür; aynı sınırlama Spotify kapak
// fotoğrafı için de geçerlidir.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface GoogleCandidate {
  placeId: string;
  name: string;
  address: string | null;
  rating: number | null;
  ratingsTotal: number | null;
  hasPhoto: boolean;
}

function formatCount(n: number | null | undefined): string {
  if (n == null) return "?";
  return n.toLocaleString("tr-TR");
}

export default function VenueGoogleEnrich({
  entityId,
  venueName,
  city,
  district,
  googlePlaceId,
  googleRating,
  googleRatingsTotal,
  enrichedAt,
}: {
  entityId: string;
  venueName: string;
  city: string | null;
  district: string | null;
  googlePlaceId: string | null;
  googleRating: number | null;
  googleRatingsTotal: number | null;
  enrichedAt: string | null;
}) {
  const router = useRouter();
  // Varsayılan sorgu ad + şehir/ilçe ile önceden dolduruluyor — kurucu
  // dilerse serbestçe düzenleyip yeniden arayabilir. 20260802160000_add_venue_city.sql
  // ile venue_details'e city eklendi (scripts/supply-import/enrich-google-venues.mjs
  // ile AYNI kural: city ?? district — artık "Kayseri" SABİT VARSAYILMIYOR,
  // çünkü içe aktarılan mekanların çoğu Kayseri'de değil).
  const defaultQuery = [venueName, city || district].filter(Boolean).join(" ").trim();
  const [query, setQuery] = useState(defaultQuery);
  const [candidates, setCandidates] = useState<GoogleCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/panel/enrich/venue-google-search?entityId=${entityId}&q=${encodeURIComponent(q)}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Arama başarısız.");
      setCandidates(j.candidates ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Arama sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const apply = async (placeId: string) => {
    setApplyingId(placeId);
    setError(null);
    try {
      const res = await fetch("/api/panel/enrich/venue-google-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, placeId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Uygulama başarısız.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uygulama sırasında hata oluştu.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google&apos;dan doldur</CardTitle>
        <CardDescription>
          Arayıp doğru mekanı seçin — puan, değerlendirme sayısı ve fotoğraflar (en fazla 6) otomatik eklenir; adres ve
          telefon yalnız boşsa doldurulur.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border p-3">
          {googlePlaceId && (
            <p className="text-[11px] text-muted-foreground">
              Bağlı Google mekan: <span className="font-mono">{googlePlaceId}</span>
              {typeof googleRating === "number" && ` · puan ${googleRating.toFixed(1)}`}
              {typeof googleRatingsTotal === "number" && ` · ${formatCount(googleRatingsTotal)} değerlendirme`}
              {enrichedAt && ` · ${new Date(enrichedAt).toLocaleDateString("tr-TR")} tarihinde eşleştirildi`}
            </p>
          )}

          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  search();
                }
              }}
              placeholder="Mekan adı ve şehir ara…"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={search} disabled={loading || !query.trim()}>
              {loading ? "Aranıyor…" : "Ara"}
            </Button>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {searched && candidates.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground">Sonuç bulunamadı.</p>
          )}

          {candidates.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {candidates.map((c) => {
                const isLinked = c.placeId === googlePlaceId;
                return (
                  <div key={c.placeId} className="flex items-center gap-3 rounded-lg border border-border p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.address ?? "adres yok"}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {typeof c.rating === "number" ? `puan ${c.rating.toFixed(1)}` : "puan yok"} ·{" "}
                        {formatCount(c.ratingsTotal)} değerlendirme · {c.hasPhoto ? "fotoğraflı" : "fotoğrafsız"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isLinked ? "secondary" : "outline"}
                      onClick={() => apply(c.placeId)}
                      disabled={applyingId === c.placeId}
                    >
                      {applyingId === c.placeId ? "…" : isLinked ? "Güncelle" : "Uygula"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
