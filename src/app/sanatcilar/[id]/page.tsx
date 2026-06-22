import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { createServiceClient } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: dj } = await supabase.from("dj_profiles").select("name, bio").eq("id", id).single();
  if (!dj) return { title: "Sanatçı Bulunamadı" };
  return {
    title: `${dj.name} — NOQT`,
    description: dj.bio ?? `${dj.name} NOQT kadrosunda yer alan DJ/sanatçıdır.`,
  };
}

export default async function DjDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: dj } = await supabase
    .from("dj_profiles")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!dj) notFound();

  const initials = dj.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const musicLinks = [
    { url: dj.soundcloud_url, label: "SoundCloud" },
    { url: dj.mixcloud_url, label: "Mixcloud" },
    { url: dj.youtube_url, label: "YouTube" },
  ].filter((l) => l.url);

  const youtubeVideos: string[] = Array.isArray(dj.youtube_links) ? dj.youtube_links : [];

  function getYouTubeEmbedId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
    return match ? match[1] : null;
  }

  // photos array (new) or fall back to single photo_url
  const photos: string[] =
    Array.isArray(dj.photos) && dj.photos.length > 0
      ? dj.photos
      : dj.photo_url
      ? [dj.photo_url]
      : [];

  const focalPoints: Record<string, { x: number; y: number }> = dj.focal_points ?? {};
  const coverPhoto = photos[0] ?? null;
  const coverFp = coverPhoto ? (focalPoints[coverPhoto] ?? { x: 50, y: 50 }) : { x: 50, y: 50 };
  const galleryPhotos = photos.slice(1);

  return (
    <>
      <Navigation />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          {/* Breadcrumb */}
          <div className="mb-12">
            <Link href="/sanatcilar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Sanatçılar
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            {/* Left: Photos */}
            <div className="lg:col-span-2 space-y-3">
              {/* Cover photo */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[oklch(0.92_0.02_320)] relative">
                {coverPhoto ? (
                  <Image
                    src={coverPhoto}
                    alt={dj.name}
                    fill
                    className="object-cover"
                    style={{ objectPosition: `${coverFp.x}% ${coverFp.y}%` }}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span
                      className="text-8xl font-light text-foreground/20"
                      style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                    >
                      {initials}
                    </span>
                  </div>
                )}
              </div>

              {/* Gallery strip */}
              {galleryPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {galleryPhotos.map((url, i) => {
                    const fp = focalPoints[url] ?? { x: 50, y: 50 };
                    return (
                      <div key={url} className="aspect-square rounded-xl overflow-hidden relative">
                        <Image
                          src={url}
                          alt={`${dj.name} ${i + 2}`}
                          fill
                          className="object-cover"
                          style={{ objectPosition: `${fp.x}% ${fp.y}%` }}
                          sizes="33vw"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="lg:col-span-3 space-y-8">
              <div>
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                  Sanatçı
                </span>
                <h1
                  className="text-4xl lg:text-5xl mt-3 text-foreground leading-tight"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                >
                  {dj.name}
                </h1>
              </div>

              {dj.bio && (
                <p className="text-muted-foreground leading-relaxed text-base">{dj.bio}</p>
              )}

              {musicLinks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Müzik</p>
                  <div className="flex flex-wrap gap-3">
                    {musicLinks.map((l) => (
                      <a
                        key={l.label} href={l.url!} target="_blank" rel="noopener noreferrer"
                        className="text-sm px-5 py-2.5 border border-border rounded-full text-foreground hover:bg-foreground hover:text-background transition-all"
                      >
                        {l.label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {youtubeVideos.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Performans Videoları</p>
                  <div className="space-y-3">
                    {youtubeVideos.map((url) => {
                      const embedId = getYouTubeEmbedId(url);
                      if (!embedId) return null;
                      return (
                        <div key={url} className="aspect-video rounded-xl overflow-hidden">
                          <iframe
                            src={`https://www.youtube.com/embed/${embedId}`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <Link
                  href="/planla"
                  className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Bu Sanatçıyla Planla
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
