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
  const { data: p } = await supabase.from("partner_profiles").select("company_name, description").eq("id", id).single();
  if (!p) return { title: "Ortak Bulunamadı" };
  return {
    title: `${p.company_name} — NOQT Ortakları`,
    description: p.description ?? `${p.company_name} NOQT ortak ekosisteminde yer almaktadır.`,
  };
}

export default async function PartnerDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: partner } = await supabase
    .from("partner_profiles")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!partner) notFound();

  type Service = { name: string; price_range: string };
  const services: Service[] = partner.services ?? [];
  const portfolio: string[] = partner.portfolio_images ?? [];

  return (
    <>
      <Navigation />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          {/* Breadcrumb */}
          <div className="mb-12">
            <Link href="/ortaklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Ortak Ağımız
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Left: Info */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-start gap-5">
                {partner.logo_url && (
                  <div className="w-16 h-16 rounded-xl border border-border bg-white overflow-hidden flex-shrink-0 relative">
                    <Image src={partner.logo_url} alt="Logo" fill className="object-contain p-2" unoptimized />
                  </div>
                )}
                <div>
                  <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                    {partner.service_category}
                  </span>
                  <h1
                    className="text-3xl lg:text-4xl mt-2 text-foreground leading-tight"
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {partner.company_name}
                  </h1>
                </div>
              </div>

              {partner.description && (
                <p className="text-muted-foreground leading-relaxed text-base">
                  {partner.description}
                </p>
              )}

              {/* Portfolio gallery */}
              {portfolio.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Portfolyo</p>
                  <div className={`grid gap-3 ${portfolio.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {portfolio.slice(0, 4).map((url, i) => (
                      <div key={i} className={`relative rounded-xl overflow-hidden bg-secondary ${i === 0 && portfolio.length >= 3 ? "col-span-2 aspect-[16/7]" : "aspect-[4/3]"}`}>
                        <Image src={url} alt={`${partner.company_name} ${i + 1}`} fill className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {services.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Hizmetler</p>
                  <div className="bg-secondary/40 rounded-2xl divide-y divide-border overflow-hidden">
                    {services.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3.5 text-sm">
                        <span className="text-foreground font-medium">{s.name}</span>
                        {s.price_range && (
                          <span className="text-muted-foreground ml-4 text-xs">{s.price_range}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Contact + CTA */}
            <div className="space-y-4">
              <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
                <p className="text-sm font-semibold text-foreground">İletişim</p>
                {partner.contact_email && (
                  <div>
                    <p className="text-xs text-muted-foreground">E-posta</p>
                    <a href={`mailto:${partner.contact_email}`} className="text-sm text-foreground hover:underline break-all">
                      {partner.contact_email}
                    </a>
                  </div>
                )}
                {partner.contact_phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <a href={`tel:${partner.contact_phone}`} className="text-sm text-foreground hover:underline">
                      {partner.contact_phone}
                    </a>
                  </div>
                )}
                {!partner.contact_email && !partner.contact_phone && (
                  <p className="text-xs text-muted-foreground">İletişim bilgisi eklenmemiş.</p>
                )}
              </div>

              <div className="bg-foreground rounded-2xl p-6 text-background space-y-3">
                <p className="text-sm font-medium">Etkinliğinde {partner.company_name} ile çalışmak ister misin?</p>
                <p className="text-xs text-background/70 leading-relaxed">
                  Deneyim planlayıcımız üzerinden talebini ilet, seni yönlendirelim.
                </p>
                <Link
                  href="/planla"
                  className="inline-flex items-center gap-2 bg-background text-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Planla →
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
