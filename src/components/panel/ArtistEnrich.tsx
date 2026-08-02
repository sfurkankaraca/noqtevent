"use client";

// Spotify/YouTube otomatik zenginleştirme — sanatçı düzenleme sayfasının
// (src/app/panel/admin/sanatcilar/[id]/page.tsx) form Card'ının ÜSTÜNDE ayrı
// bir Card olarak render edilir. MediaManager'ın aksine bu bileşen ana forma
// hidden input BESLEMEZ — arama/uygulama kendi fetch çağrılarıyla doğrudan
// DB'ye yazar (bkz. /api/panel/enrich/*), sonra router.refresh() ile server
// component'i yeniden render ettirip ana formun defaultValue'larını (photo_url,
// genres, links.spotify/youtube) tazeler.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SpotifyCandidate {
  id: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
  popularity: number;
  followers: number;
}

interface YoutubeCandidate {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
}

function formatCount(n: number | null | undefined): string {
  if (n == null) return "?";
  return n.toLocaleString("tr-TR");
}

function SpotifySection({
  entityId,
  linkedArtistId,
  popularity,
  followers,
  enrichedAt,
}: {
  entityId: string;
  linkedArtistId: string | null;
  popularity: number | null;
  followers: number | null;
  enrichedAt: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<SpotifyCandidate[]>([]);
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
      const res = await fetch(`/api/panel/enrich/spotify-search?entityId=${entityId}&q=${encodeURIComponent(q)}`);
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

  const apply = async (spotifyArtistId: string) => {
    setApplyingId(spotifyArtistId);
    setError(null);
    try {
      const res = await fetch("/api/panel/enrich/spotify-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, spotifyArtistId }),
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
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">Spotify&apos;dan doldur</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Arayıp bir sanatçı seçin — kapak fotoğrafı (yalnız boşsa), türler ve popülerlik/takipçi otomatik doldurulur.
        </p>
        {linkedArtistId && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Bağlı Spotify ID: <span className="font-mono">{linkedArtistId}</span>
            {typeof popularity === "number" && ` · popülerlik ${popularity}`}
            {typeof followers === "number" && ` · ${formatCount(followers)} takipçi`}
            {enrichedAt && ` · ${new Date(enrichedAt).toLocaleDateString("tr-TR")} tarihinde eşleştirildi`}
          </p>
        )}
      </div>

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
          placeholder="Sanatçı adı ara…"
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
            const isLinked = c.id === linkedArtistId;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-border bg-secondary/30">
                  {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {c.genres.slice(0, 2).join(", ") || "tür yok"} · pop. {c.popularity} · {formatCount(c.followers)} takipçi
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isLinked ? "secondary" : "outline"}
                  onClick={() => apply(c.id)}
                  disabled={applyingId === c.id}
                >
                  {applyingId === c.id ? "…" : isLinked ? "Güncelle" : "Uygula"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function YoutubeSection({ entityId, linkedChannelId }: { entityId: string; linkedChannelId: string | null }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<YoutubeCandidate[]>([]);
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
      const res = await fetch(`/api/panel/enrich/youtube-search?entityId=${entityId}&q=${encodeURIComponent(q)}`);
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

  const apply = async (channelId: string) => {
    setApplyingId(channelId);
    setError(null);
    try {
      const res = await fetch("/api/panel/enrich/youtube-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, channelId }),
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
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">YouTube kanalı bağla</p>
        <p className="text-xs text-muted-foreground mt-0.5">Kanalı arayıp seçince kanal linki profile eklenir.</p>
        {linkedChannelId && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Bağlı kanal ID: <span className="font-mono">{linkedChannelId}</span>
          </p>
        )}
      </div>

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
          placeholder="Kanal adı ara…"
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
            const isLinked = c.id === linkedChannelId;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-border bg-secondary/30">
                  {c.thumbnailUrl && (
                    <Image src={c.thumbnailUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {c.subscriberCount != null ? `${formatCount(c.subscriberCount)} abone` : "abone sayısı gizli"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isLinked ? "secondary" : "outline"}
                  onClick={() => apply(c.id)}
                  disabled={applyingId === c.id}
                >
                  {applyingId === c.id ? "…" : isLinked ? "Güncelle" : "Bağla"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ArtistEnrich({
  entityId,
  spotifyArtistId,
  spotifyPopularity,
  spotifyFollowers,
  enrichedAt,
  youtubeChannelId,
}: {
  entityId: string;
  spotifyArtistId: string | null;
  spotifyPopularity: number | null;
  spotifyFollowers: number | null;
  enrichedAt: string | null;
  youtubeChannelId: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Otomatik zenginleştirme</CardTitle>
        <CardDescription>Spotify/YouTube&apos;dan arayıp uygulayın — aşağıdaki form uygulama sonrası tazelenir.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SpotifySection
          entityId={entityId}
          linkedArtistId={spotifyArtistId}
          popularity={spotifyPopularity}
          followers={spotifyFollowers}
          enrichedAt={enrichedAt}
        />
        <YoutubeSection entityId={entityId} linkedChannelId={youtubeChannelId} />
      </CardContent>
    </Card>
  );
}
