import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("client_name, event_type")
    .eq("delivery_slug", slug)
    .single();
  if (!booking) return { title: "Teslimat Bulunamadı" };
  return {
    title: `Etkinlik Teslim Raporu — ${booking.client_name}`,
    robots: { index: false },
  };
}

function downloadUrl(url: string, name: string) {
  return `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
}

export default async function DeliveryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name, performer_type, slug)")
    .eq("delivery_slug", slug)
    .single();

  if (!booking) notFound();

  const photos: string[] = Array.isArray(booking.delivery_photos) ? booking.delivery_photos : [];
  const videos: string[] = Array.isArray(booking.delivery_videos) ? booking.delivery_videos : [];

  const eventDateStr = booking.event_date
    ? new Date(booking.event_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-white text-foreground">
      <style>{`
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="no-print border-b border-border px-6 py-3 flex items-center justify-between max-w-4xl mx-auto">
        <a href={process.env.NEXT_PUBLIC_URL || "https://www.noqt.events"} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          noqt.events
        </a>
        {booking.contract_url && (
          <a href={downloadUrl(booking.contract_url, "sozlesme.pdf")}
            className="text-xs px-4 py-1.5 border border-border rounded-full text-foreground hover:bg-secondary transition-colors">
            Sözleşmeyi İndir ↓
          </a>
        )}
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-3">
          Etkinlik Teslim Raporu
        </p>
        <h1
          className="text-4xl lg:text-5xl text-foreground leading-tight mb-6"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          {booking.client_name}
        </h1>

        {/* Özet */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-12 rounded-xl border border-border p-5 text-sm">
          {booking.event_type && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Etkinlik</p>
              <p className="font-medium text-foreground">{booking.event_type}</p>
            </div>
          )}
          {eventDateStr && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tarih</p>
              <p className="font-medium text-foreground">{eventDateStr}</p>
            </div>
          )}
          {booking.venue_name && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mekan</p>
              <p className="font-medium text-foreground">{booking.venue_name}</p>
            </div>
          )}
          {booking.dj_profiles?.name && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sanatçı</p>
              <p className="font-medium text-foreground">
                {booking.dj_profiles.name}
                {booking.dj_profiles.slug && (
                  <a href={`/s/${booking.dj_profiles.slug}`} target="_blank" rel="noopener noreferrer"
                    className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors no-print">
                    (Presskit ↗)
                  </a>
                )}
              </p>
            </div>
          )}
        </div>

        {booking.delivery_notes && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-12 max-w-2xl">{booking.delivery_notes}</p>
        )}

        {/* Fotoğraflar */}
        {photos.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                Fotoğraflar ({photos.length})
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, i) => (
                <div key={url} className="group relative rounded-xl overflow-hidden bg-secondary/20" style={{ aspectRatio: "4/3" }}>
                  <Image src={url} alt={`Fotoğraf ${i + 1}`} fill className="object-cover" unoptimized />
                  <a
                    href={downloadUrl(url, `fotograf-${i + 1}.jpg`)}
                    className="no-print absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <span className="text-xs px-3 py-1.5 bg-white text-foreground rounded-full font-medium">İndir ↓</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videolar */}
        {videos.length > 0 && (
          <div className="mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
              Videolar ({videos.length})
            </p>
            <div className="space-y-4">
              {videos.map((url, i) => (
                <div key={url} className="rounded-xl overflow-hidden border border-border">
                  <video src={url} controls className="w-full max-h-96 bg-black" preload="metadata" />
                  <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/20">
                    <span className="text-xs text-muted-foreground">Video {i + 1}</span>
                    <a href={downloadUrl(url, `video-${i + 1}.mp4`)}
                      className="no-print text-xs text-foreground hover:underline">
                      İndir ↓
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {photos.length === 0 && videos.length === 0 && (
          <div className="rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
            Medya henüz yüklenmedi.
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Bu rapor <a href={process.env.NEXT_PUBLIC_URL || "https://www.noqt.events"} className="hover:text-foreground transition-colors">noqt.events</a> tarafından oluşturulmuştur.
          </p>
        </div>
      </main>
    </div>
  );
}
