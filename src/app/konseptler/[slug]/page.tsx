import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { createServiceClient } from "@/lib/supabase";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: c } = await supabase.from("concepts").select("name, description").eq("slug", slug).single();
  if (!c) return { title: "Konsept Bulunamadı" };
  return {
    title: `${c.name} — NOQT Konseptleri`,
    description: c.description ?? undefined,
  };
}

function toSpotifyEmbedUrl(url: string): string {
  // https://open.spotify.com/playlist/ID → https://open.spotify.com/embed/playlist/ID
  return url.replace("open.spotify.com/", "open.spotify.com/embed/").split("?")[0];
}

const CATEGORY_LABELS: Record<string, string> = {
  "cocktail": "Kokteyl & Karşılama",
  "celebration": "Ana Kutlama",
  "traditional": "Geleneksel",
  "after-party": "After Party",
};

export default async function ConceptDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: c } = await supabase
    .from("concepts")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!c) notFound();

  const textColor = c.is_dark ? "text-white" : "text-foreground";
  const mutedColor = c.is_dark ? "text-white/60" : "text-muted-foreground";
  const borderColor = c.is_dark ? "border-white/15" : "border-border";

  return (
    <>
      <Navigation />
      <main className="pt-20">
        {/* Hero */}
        <div className={`${c.color} relative`}>
          {c.cover_image_url ? (
            <div className="absolute inset-0">
              <Image src={c.cover_image_url} alt={c.name} fill className="object-cover opacity-60" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
            </div>
          ) : null}
          <div className="relative max-w-5xl mx-auto px-6 lg:px-8 pt-16 pb-20">
            <Link href="/konseptler" className={`text-sm ${mutedColor} hover:${textColor} transition-colors`}>
              ← Konseptler
            </Link>
            <div className="mt-8 flex items-start gap-6">
              <span className="text-7xl">{c.emoji}</span>
              <div>
                <span className={`text-xs tracking-[0.2em] uppercase font-medium ${mutedColor}`}>
                  {CATEGORY_LABELS[c.category] ?? c.category}
                </span>
                <h1
                  className={`text-5xl lg:text-6xl mt-2 leading-tight ${textColor}`}
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                >
                  {c.name}
                  {c.is_signature && (
                    <span className="ml-4 text-sm align-middle px-3 py-1 bg-foreground text-background rounded-full font-normal" style={{ fontFamily: "inherit" }}>
                      İmza
                    </span>
                  )}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main */}
            <div className="lg:col-span-2 space-y-10">
              {c.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
              )}

              {c.musical_direction?.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Müzik Yönü</h2>
                  <div className="flex flex-wrap gap-2">
                    {(c.musical_direction as string[]).map((m) => (
                      <span key={m} className="text-sm px-4 py-2 border border-border rounded-full text-foreground">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {c.atmosphere?.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Atmosfer</h2>
                  <div className="flex flex-wrap gap-2">
                    {(c.atmosphere as string[]).map((a) => (
                      <span key={a} className="text-sm px-4 py-2 bg-secondary rounded-full text-foreground">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Energy bar */}
              <div className="space-y-3">
                <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Enerji Seviyesi</h2>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-5 rounded-sm transition-all ${i < (c.energy_level ?? 5) ? "bg-foreground" : "bg-foreground/10"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{c.energy_level}/10</span>
                </div>
              </div>

              {/* Spotify embed */}
              {c.spotify_playlist_url && (
                <div className="space-y-3">
                  <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Playlist</h2>
                  <iframe
                    src={toSpotifyEmbedUrl(c.spotify_playlist_url)}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-2xl"
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className={`rounded-2xl border ${borderColor} p-6 space-y-4 ${c.color}`}>
                <p className={`text-xs uppercase tracking-widest font-medium ${mutedColor}`}>Bu konsept için ideal</p>
                <p className={`text-sm leading-relaxed ${textColor}`}>
                  {c.category === "cocktail" && "Misafir karşılama, kokteyl saatleri, sohbet ortamı gerektiren etkinlikler."}
                  {c.category === "celebration" && "Ana kutlama bölümü, dans pisti açılışı, geceyi zirveye taşıyacak saatler."}
                  {c.category === "traditional" && "Geleneksel ritüeller, halay saatleri, kültürel dokunuşlar içeren etkinlikler."}
                  {c.category === "after-party" && "Gece geç saatler, after party, enerjinin doruk noktasında olduğu bölümler."}
                </p>
              </div>

              <div className="rounded-2xl bg-foreground p-6 text-background space-y-3">
                <p className="text-sm font-medium">Bu konseptle etkinlik planla</p>
                <p className="text-xs text-background/70 leading-relaxed">
                  Deneyim planlayıcımızda <strong>{c.name}</strong> konseptini seçerek başla.
                </p>
                <Link
                  href="/planla"
                  className="inline-flex items-center gap-2 bg-background text-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Planlamaya Başla →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
