import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Müzik Konseptleri — NOQT",
  description: "NOQT'un sunduğu müzik konseptleri. Her etkinlik için doğru atmosferi birlikte yaratıyoruz.",
};

const CATEGORY_LABELS: Record<string, string> = {
  "cocktail": "Kokteyl & Karşılama",
  "celebration": "Ana Kutlama",
  "traditional": "Geleneksel",
  "after-party": "After Party",
};

const CATEGORY_ORDER = ["cocktail", "celebration", "traditional", "after-party"];

export default async function KonseptlerPage() {
  const supabase = createServiceClient();
  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, slug, name, emoji, category, description, atmosphere, musical_direction, cover_image_url, color, is_dark, is_signature, energy_level")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  const grouped = (concepts ?? []).reduce<Record<string, typeof concepts>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category]!.push(c);
    return acc;
  }, {});

  return (
    <>
      <Navigation />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          {/* Header */}
          <div className="mb-16 max-w-2xl">
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Atmosfer Rehberi
            </span>
            <h1
              className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Müzik Konseptleri
            </h1>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Her etkinlik farklı bir his taşır. Misafirlerinizin kim olduğuna, sahnenin ruhuna
              ve hayal ettiğiniz ana göre — doğru konsepti birlikte seçiyoruz.
            </p>
          </div>

          {/* Sections by category */}
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <section key={cat} className="mb-20">
                <h2
                  className="text-2xl mb-8 text-foreground"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                >
                  {CATEGORY_LABELS[cat]}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((c) => (
                    <Link key={c.id} href={`/konseptler/${c.slug}`} className="group block">
                      <div className={`rounded-2xl overflow-hidden border border-transparent hover:border-foreground/10 hover:shadow-lg transition-all ${c.color}`}>
                        {/* Visual area */}
                        <div className="relative h-48">
                          {c.cover_image_url ? (
                            <Image src={c.cover_image_url} alt={c.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-end p-5">
                              <span className="text-5xl">{c.emoji}</span>
                            </div>
                          )}
                          {c.is_signature && (
                            <div className="absolute top-4 right-4">
                              <span className="text-xs px-2.5 py-1 bg-foreground text-background rounded-full font-medium">
                                İmza Konsept
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className={`p-5 ${c.is_dark ? "text-white" : "text-foreground"}`}>
                          <h3 className="font-medium text-lg">{c.name}</h3>
                          {c.description && (
                            <p className={`text-sm mt-1.5 leading-relaxed line-clamp-2 ${c.is_dark ? "text-white/70" : "text-muted-foreground"}`}>
                              {c.description}
                            </p>
                          )}
                          {c.atmosphere?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {c.atmosphere.slice(0, 3).map((a: string) => (
                                <span
                                  key={a}
                                  className={`text-xs px-2 py-0.5 rounded-full border ${c.is_dark ? "border-white/20 text-white/70" : "border-border text-muted-foreground"}`}
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-1.5 w-2 rounded-sm ${i < (c.energy_level ?? 5) ? (c.is_dark ? "bg-white/60" : "bg-foreground/50") : (c.is_dark ? "bg-white/10" : "bg-foreground/10")}`}
                                />
                              ))}
                            </div>
                            <span className={`text-xs ${c.is_dark ? "text-white/50" : "text-muted-foreground"} group-hover:${c.is_dark ? "text-white" : "text-foreground"} transition-colors`}>
                              Keşfet →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* CTA */}
          <div className="bg-foreground rounded-2xl p-10 text-background text-center mt-8">
            <h3
              className="text-3xl"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Hangi konsept senin için?
            </h3>
            <p className="text-background/70 mt-3 text-sm">
              Deneyim planlayıcısını kullan — sana özel bir atmosfer önerisi hazırlayalım.
            </p>
            <Link
              href="/planla"
              className="inline-flex items-center gap-2 mt-6 bg-background text-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Deneyimi Tasarla
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
