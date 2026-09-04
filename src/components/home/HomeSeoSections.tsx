import Link from "next/link";
import { EVENT_PAGES } from "@/lib/eventPages";
import { HOME_FAQ } from "@/lib/homeFaq";

type Post = {
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  read_time: string | null;
};

type Testimonial = {
  quote: string;
  name: string;
  event: string | null;
  rating: number | null;
};

// Hero'nun hemen altında tek, vurucu sosyal kanıt satırı
export function HeroProof({ testimonial }: { testimonial: Testimonial | null }) {
  if (!testimonial) return null;
  const rating = testimonial.rating ?? 5;
  return (
    <section className="border-y border-border bg-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center sm:text-left">
        <span className="text-amber-500 text-sm tracking-widest flex-shrink-0" aria-label={`${rating} yıldız`}>
          {"★".repeat(Math.round(rating))}
        </span>
        <p className="text-sm text-foreground leading-relaxed max-w-2xl">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <p className="text-xs text-muted-foreground flex-shrink-0">
          — {testimonial.name}
          {testimonial.event ? `, ${testimonial.event}` : ""}
        </p>
      </div>
    </section>
  );
}

// Etkinlik türü sayfalarına iç link ağı
export function EventLinks() {
  return (
    <section className="py-20 lg:py-24 bg-background">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-3">
          Hizmetlerimiz
        </p>
        <h2
          className="text-3xl lg:text-4xl text-foreground mb-10"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Her etkinlik türü için özel müzik deneyimi
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {EVENT_PAGES.map((p) => (
            <Link
              key={p.slug}
              href={`/etkinlikler/${p.slug}`}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-foreground/40 transition-colors"
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className="text-sm font-medium text-foreground group-hover:underline underline-offset-2">
                {p.title}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/fiyatlar" className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors">
            Fiyatlar ve paketleri incele →
          </Link>
          <Link href="/konseptler" className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors">
            Müzik konseptlerini keşfet →
          </Link>
        </div>
      </div>
    </section>
  );
}

// Görünür SSS — FAQPage schema ile aynı kaynaktan (lib/homeFaq)
export function HomeFaq() {
  return (
    <section className="py-20 lg:py-24 bg-background border-t border-border">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-3">
          Sıkça Sorulan Sorular
        </p>
        <h2
          className="text-3xl lg:text-4xl text-foreground mb-10"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Merak edilenler
        </h2>
        <div className="divide-y divide-border border-y border-border">
          {HOME_FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-medium text-foreground">
                {item.q}
                <span className="flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-45 text-lg leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// Journal'dan son yazılar — taze içerik sinyali + long-tail iç link
export function JournalTeaser({ posts }: { posts: Post[] }) {
  if (!posts.length) return null;
  return (
    <section className="py-20 lg:py-24 bg-background border-t border-border">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-3">
              Journal
            </p>
            <h2
              className="text-3xl lg:text-4xl text-foreground"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Rehberler & fikirler
            </h2>
          </div>
          <Link href="/journal" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            Tümü →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/journal/${post.slug}`}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-foreground/40 transition-colors flex flex-col gap-3"
            >
              {post.category && (
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                  {post.category}
                </span>
              )}
              <h3 className="text-base font-semibold text-foreground leading-snug group-hover:underline underline-offset-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{post.excerpt}</p>
              )}
              {post.read_time && (
                <span className="text-[11px] text-muted-foreground mt-auto">{post.read_time}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
