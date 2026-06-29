import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { createServiceClient } from "@/lib/supabase";
import DjGallery from "./DjGallery";

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

  const musicLinks = [
    { url: dj.soundcloud_url, label: "SoundCloud" },
    { url: dj.mixcloud_url, label: "Mixcloud" },
    { url: dj.youtube_url, label: "YouTube" },
  ].filter((l) => l.url);

  const youtubeVideos: string[] = Array.isArray(dj.youtube_links) ? dj.youtube_links : [];
  const uploadedVideos: string[] = Array.isArray(dj.videos) && dj.videos.length > 0
    ? dj.videos
    : dj.preview_video_url ? [dj.preview_video_url] : [];

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
            {/* Left: Photos + Videos (client component with lightbox) */}
            <div className="lg:col-span-2 space-y-3">
              <DjGallery
                photos={photos}
                focalPoints={focalPoints}
                name={dj.name}
                uploadedVideos={uploadedVideos}
              />
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

              {dj.presskit_url && (
                <div>
                  <a
                    href={dj.presskit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Press Kit ↓
                  </a>
                </div>
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
