import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase";
import PrintButton from "@/components/PrintButton";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: dj } = await supabase
    .from("dj_profiles")
    .select("name, bio, photo_url")
    .eq("slug", slug)
    .single();
  if (!dj) return { title: "Sanatçı Bulunamadı" };
  return {
    title: `${dj.name} — Press Kit`,
    description: dj.bio ?? `${dj.name} press kit ve biyografisi.`,
    openGraph: dj.photo_url ? { images: [dj.photo_url] } : undefined,
    robots: { index: false },
  };
}

const PERFORMER_LABELS: Record<string, string> = {
  dj: "DJ",
  artist: "Solo Sanatçı",
  trio: "Trio / Grup",
  dance: "Dans Ekibi",
  band: "Bando / Orkestra",
  host: "Sunucu / MC",
  moderator: "Moderatör",
};

const EVENT_LABELS: Record<string, string> = {
  wedding: "Düğün / Nikah",
  kina: "Kına Gecesi",
  graduation: "Mezuniyet",
  birthday: "Doğum Günü",
  bride: "Bekarlığa Veda",
  "morning-party": "Morning Party",
  corporate: "Kurumsal Etkinlik",
  "after-party": "After Party",
  cocktail: "Kokteyl / Resepsiyon",
  festival: "Festival / Açık Hava",
};

const SOCIAL_LINKS = [
  { key: "instagram_url", label: "Instagram" },
  { key: "spotify_url", label: "Spotify" },
  { key: "soundcloud_url", label: "SoundCloud" },
  { key: "mixcloud_url", label: "Mixcloud" },
  { key: "youtube_url", label: "YouTube" },
  { key: "website_url", label: "Website" },
];

export default async function PresskitPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: dj } = await supabase
    .from("dj_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!dj) notFound();

  const photos: string[] =
    Array.isArray(dj.photos) && dj.photos.length > 0
      ? dj.photos
      : dj.photo_url
      ? [dj.photo_url]
      : [];

  const focalPoints: Record<string, { x: number; y: number }> = dj.focal_points ?? {};
  const eventTypes: string[] = Array.isArray(dj.event_types) ? dj.event_types : [];
  const conceptTags: string[] = Array.isArray(dj.concept_tags) ? dj.concept_tags : [];
  const coverCities: string[] = Array.isArray(dj.cover_cities) ? dj.cover_cities : [];
  type RiderItem = { item: string; qty: number; provided_by: "organizer" | "artist"; notes?: string };
  const riderItems: RiderItem[] = Array.isArray(dj.rider) ? dj.rider : [];

  const socialLinks = SOCIAL_LINKS.map((s) => ({
    label: s.label,
    url: (dj as Record<string, string | null>)[s.key] ?? null,
  })).filter((s) => s.url);

  const BASE = process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events";

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print border-b border-border px-6 py-3 flex items-center justify-between max-w-4xl mx-auto">
        <a href={BASE} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          noqt.events
        </a>
        <div className="flex items-center gap-3">
          {dj.rider_url && (
            <a
              href={dj.rider_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-4 py-1.5 border border-border rounded-full text-foreground hover:bg-foreground hover:text-background transition-all"
            >
              Rider İndir ↓
            </a>
          )}
          <PrintButton className="text-xs px-4 py-1.5 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity">
            PDF Olarak Kaydet
          </PrintButton>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start mb-14">
          {/* Cover photo */}
          {photos[0] && (
            <div
              className="relative rounded-2xl overflow-hidden bg-secondary/20"
              style={{ aspectRatio: "3/4" }}
            >
              <Image
                src={photos[0]}
                alt={dj.name}
                fill
                className="object-cover"
                unoptimized
                style={{
                  objectPosition: `${focalPoints[photos[0]]?.x ?? 50}% ${focalPoints[photos[0]]?.y ?? 50}%`,
                }}
                priority
              />
            </div>
          )}

          {/* Identity */}
          <div className={photos[0] ? "lg:col-span-2" : "lg:col-span-3"}>
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-3">
              {PERFORMER_LABELS[dj.performer_type] ?? "Sanatçı"}
              {dj.city ? ` · ${dj.city}` : ""}
            </p>
            <h1
              className="text-5xl lg:text-6xl text-foreground leading-tight mb-6"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              {dj.name}
            </h1>

            {dj.speciality && (
              <p className="text-base text-muted-foreground mb-6">{dj.speciality}</p>
            )}

            {dj.bio && (
              <p className="text-base text-foreground leading-relaxed">{dj.bio}</p>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
          {/* Etkinlik tipleri */}
          {eventTypes.length > 0 && (
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
                Etkinlik Tipleri
              </p>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((et) => (
                  <span
                    key={et}
                    className="text-xs px-3 py-1.5 border border-border rounded-full text-foreground"
                  >
                    {EVENT_LABELS[et] ?? et}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hizmet verilen şehirler */}
          {coverCities.length > 0 && (
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
                Hizmet Bölgeleri
              </p>
              <div className="flex flex-wrap gap-2">
                {coverCities.map((city) => (
                  <span
                    key={city}
                    className="text-xs px-3 py-1.5 border border-border rounded-full text-foreground"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Konseptler */}
          {conceptTags.length > 0 && (
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
                Konseptler
              </p>
              <div className="flex flex-wrap gap-2">
                {conceptTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-full text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Repertuar */}
          {dj.repertoire && (
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
                Repertuar
              </p>
              <p className="text-sm text-foreground leading-relaxed">{dj.repertoire}</p>
            </div>
          )}
        </div>

        {/* Teknik Rider */}
        {riderItems.length > 0 && (
          <div className="mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
              Teknik Rider
            </p>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground tracking-wide">Ekipman</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground tracking-wide">Adet</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground tracking-wide">Sağlayan</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground tracking-wide">Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {riderItems.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "" : "bg-secondary/10"}>
                      <td className="px-4 py-2.5 font-medium text-foreground">{r.item}</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground tabular-nums">{r.qty}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${
                          r.provided_by === "organizer"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-green-200 bg-green-50 text-green-700"
                        }`}>
                          {r.provided_by === "organizer" ? "Organizatör" : "Sanatçı"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.notes ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ek fotoğraflar */}
        {photos.length > 1 && (
          <div className="mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
              Fotoğraflar
            </p>
            <div className="grid grid-cols-3 gap-3">
              {photos.slice(1, 7).map((url) => (
                <div
                  key={url}
                  className="relative rounded-xl overflow-hidden bg-secondary/20"
                  style={{ aspectRatio: "4/3" }}
                >
                  <Image
                    src={url}
                    alt={dj.name}
                    fill
                    className="object-cover"
                    unoptimized
                    style={{
                      objectPosition: `${focalPoints[url]?.x ?? 50}% ${focalPoints[url]?.y ?? 50}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social + Contact + Rider */}
        <div className="border-t border-border pt-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="space-y-4">
            {socialLinks.length > 0 && (
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-3">
                  Bağlantılar
                </p>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-4 py-2 border border-border rounded-full text-foreground hover:bg-foreground hover:text-background transition-all"
                    >
                      {s.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}

            {(dj.email || dj.phone) && (
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-3">
                  İletişim
                </p>
                <div className="space-y-1 text-sm text-foreground">
                  {dj.email && <p>{dj.email}</p>}
                  {dj.phone && <p>{dj.phone}</p>}
                </div>
              </div>
            )}
          </div>

          {dj.rider_url && (
            <a
              href={dj.rider_url}
              target="_blank"
              rel="noopener noreferrer"
              className="no-print inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity self-start"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Rider İndir
            </a>
          )}
        </div>

        {/* NOQT footer */}
        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Bu profil <a href={BASE} className="hover:text-foreground transition-colors">noqt.events</a> tarafından oluşturulmuştur.
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
          </p>
        </div>
      </main>
    </div>
  );
}
