import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase";
import PrintButton from "@/components/PrintButton";

type Props = { params: Promise<{ slug: string }> };

const CATEGORY_LABELS: Record<string, string> = {
  venue: "Mekan",
  "photo-video": "Fotoğraf & Video",
  decor: "Dekorasyon & Çiçek",
  catering: "Catering & İkram",
  cake: "Pasta & Tatlı",
  beauty: "Güzellik & Bakım",
  transport: "Ulaşım & Transfer",
  invitation: "Davetiye & Tasarım",
  "dance-class": "Dans Kursu",
  planning: "Organizasyon & Planlama",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: p } = await supabase
    .from("partner_profiles")
    .select("business_name, description, logo_url")
    .eq("slug", slug)
    .single();
  if (!p) return { title: "Partner Bulunamadı" };
  return {
    title: `${p.business_name} — Toolkit`,
    description: p.description ?? `${p.business_name} teknik detayları ve paketleri.`,
    openGraph: p.logo_url ? { images: [p.logo_url] } : undefined,
    robots: { index: false },
  };
}

type Spec = { label: string; value: string };
type Pkg = { name: string; price: string; description: string };

export default async function PartnerToolkitPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: partner } = await supabase
    .from("partner_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!partner) notFound();

  const photos: string[] = Array.isArray(partner.photos) ? partner.photos : [];
  const focalPoints: Record<string, { x: number; y: number }> = partner.focal_points ?? {};
  const categories: string[] = Array.isArray(partner.category) ? partner.category : [];
  const services: string[] = Array.isArray(partner.services) ? partner.services : [];
  const coverCities: string[] = Array.isArray(partner.cover_cities) ? partner.cover_cities : [];
  const specs: Spec[] = Array.isArray(partner.tool_data?.specs) ? partner.tool_data.specs : [];
  const packages: Pkg[] = Array.isArray(partner.tool_data?.packages) ? partner.tool_data.packages : [];

  const BASE = process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events";

  return (
    <div className="min-h-screen bg-white text-foreground">
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
        <PrintButton className="text-xs px-4 py-1.5 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity">
          PDF Olarak Kaydet
        </PrintButton>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        {/* Header */}
        <div className="flex items-start gap-5 mb-10">
          {partner.logo_url && (
            <div className="w-16 h-16 rounded-xl border border-border bg-white overflow-hidden flex-shrink-0 relative">
              <Image src={partner.logo_url} alt="Logo" fill className="object-contain p-2" unoptimized />
            </div>
          )}
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-2">
              {categories.map((c) => CATEGORY_LABELS[c] ?? c).join(" · ") || "Partner"}
              {partner.city ? ` · ${partner.city}` : ""}
            </p>
            <h1
              className="text-4xl lg:text-5xl text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              {partner.business_name}
            </h1>
          </div>
        </div>

        {partner.description && (
          <p className="text-base text-foreground leading-relaxed mb-12 max-w-2xl">{partner.description}</p>
        )}

        {/* Teknik Detaylar */}
        {specs.length > 0 && (
          <div className="mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
              Teknik Detaylar
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 rounded-xl border border-border p-5">
              {specs.map((s, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-border/60 pb-2 last:border-0">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paketler */}
        {packages.length > 0 && (
          <div className="mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
              Paketler
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg, i) => (
                <div key={i} className="rounded-xl border border-border p-5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-foreground">{pkg.name}</p>
                    {pkg.price && <p className="text-sm font-medium text-foreground">{pkg.price}</p>}
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Fiyatlar tahminidir; kesin teklif etkinlik detaylarına göre ayrıca sunulur.
            </p>
          </div>
        )}

        {/* Hizmetler */}
        {services.length > 0 && (
          <div className="mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
              Hizmetler
            </p>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <span key={s} className="text-xs px-3 py-1.5 border border-border rounded-full text-foreground">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Hizmet bölgeleri */}
        {coverCities.length > 0 && (
          <div className="mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
              Hizmet Bölgeleri
            </p>
            <div className="flex flex-wrap gap-2">
              {coverCities.map((c) => (
                <span key={c} className="text-xs px-3 py-1.5 border border-border rounded-full text-foreground">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Portföy */}
        {photos.length > 0 && (
          <div className="mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
              Portföy
            </p>
            <div className="grid grid-cols-2 gap-3">
              {photos.slice(0, 6).map((url) => (
                <div key={url} className="relative rounded-xl overflow-hidden bg-secondary/20" style={{ aspectRatio: "16/9" }}>
                  <Image src={url} alt={partner.business_name} fill className="object-cover" unoptimized
                    style={{ objectPosition: `${focalPoints[url]?.x ?? 50}% ${focalPoints[url]?.y ?? 50}%` }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* İletişim */}
        <div className="border-t border-border pt-10 space-y-3">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-3">İletişim</p>
          <div className="space-y-1 text-sm text-foreground">
            {partner.contact_name && <p>{partner.contact_name}</p>}
            {partner.email && <p>{partner.email}</p>}
            {partner.phone && <p>{partner.phone}</p>}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {partner.instagram_url && (
              <a href={partner.instagram_url} target="_blank" rel="noopener noreferrer"
                className="text-xs px-4 py-2 border border-border rounded-full text-foreground hover:bg-foreground hover:text-background transition-all">
                Instagram ↗
              </a>
            )}
            {partner.website_url && (
              <a href={partner.website_url} target="_blank" rel="noopener noreferrer"
                className="text-xs px-4 py-2 border border-border rounded-full text-foreground hover:bg-foreground hover:text-background transition-all">
                Website ↗
              </a>
            )}
          </div>
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
