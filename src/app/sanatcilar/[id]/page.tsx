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
            {/* Left: Photo */}
            <div className="lg:col-span-2">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[oklch(0.92_0.02_320)] relative">
                {dj.photo_url ? (
                  <Image src={dj.photo_url} alt={dj.name} fill className="object-cover" unoptimized />
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

              {dj.concept_tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(dj.concept_tags as string[]).map((tag) => (
                    <span key={tag} className="text-xs px-3 py-1.5 border border-border rounded-full text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {dj.bio && (
                <p className="text-muted-foreground leading-relaxed text-base">
                  {dj.bio}
                </p>
              )}

              {musicLinks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Müzik</p>
                  <div className="flex flex-wrap gap-3">
                    {musicLinks.map((l) => (
                      <a
                        key={l.label}
                        href={l.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm px-5 py-2.5 border border-border rounded-full text-foreground hover:bg-foreground hover:text-background transition-all"
                      >
                        {l.label} ↗
                      </a>
                    ))}
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
