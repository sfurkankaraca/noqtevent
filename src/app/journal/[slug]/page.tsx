import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { createServiceClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/jsonLd"; // Bulgu 9: </script> kaçışı

type Props = { params: Promise<{ slug: string }> };

const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: p } = await supabase
    .from("journal_posts")
    .select("title, excerpt, cover_image_url, published_at, category")
    .eq("slug", slug)
    .single();
  if (!p) return { title: "Yazı Bulunamadı" };
  return {
    title: p.title,
    description: p.excerpt ?? undefined,
    keywords: [
      "kayseri düğün dj", "nevşehir düğün dj", "kapadokya düğün müziği",
      p.category ?? "düğün müziği",
    ],
    openGraph: {
      type: "article",
      title: p.title,
      description: p.excerpt ?? undefined,
      url: `${BASE}/journal/${slug}`,
      images: p.cover_image_url ? [{ url: p.cover_image_url }] : [],
      publishedTime: p.published_at ?? undefined,
      locale: "tr_TR",
      siteName: "NOQT Journal",
    },
    alternates: { canonical: `${BASE}/journal/${slug}` },
  };
}

export default async function JournalPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: post } = await supabase
    .from("journal_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    url: `${BASE}/journal/${slug}`,
    image: post.cover_image_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    author: { "@type": "Organization", name: "NOQT", url: BASE },
    publisher: {
      "@type": "Organization",
      name: "NOQT",
      logo: { "@type": "ImageObject", url: `${BASE}/noqt-logo-transparent.png` },
    },
    inLanguage: "tr",
    keywords: ["kayseri düğün dj", "nevşehir düğün dj", "kapadokya", post.category].filter(Boolean).join(", "),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: BASE },
      { "@type": "ListItem", position: 2, name: "Journal", item: `${BASE}/journal` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${BASE}/journal/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
      <Navigation />
      <main className="pt-20">
        {/* Hero */}
        {post.cover_image_url && (
          <div className={`relative h-72 lg:h-96 ${post.color ?? "bg-secondary"}`}>
            <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" sizes="100vw" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
          {/* Breadcrumb */}
          <Link href="/journal" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Journal
          </Link>

          {/* Header */}
          <div className="mt-8 mb-10">
            {post.category && (
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{post.category}</span>
            )}
            <h1
              className="text-4xl lg:text-5xl mt-3 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              {post.title}
            </h1>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {post.read_time && <span>{post.read_time} okuma</span>}
              {post.published_at && (
                <span>
                  {new Date(post.published_at).toLocaleDateString("tr-TR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          {post.excerpt && !post.content && (
            <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
          )}

          {post.content && (
            <div className="prose prose-neutral max-w-none text-foreground leading-relaxed space-y-4">
              {post.content.split("\n\n").map((paragraph: string, i: number) => {
                if (paragraph.startsWith("## ")) {
                  return (
                    <h2 key={i} className="text-2xl font-medium mt-8 mb-4" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}>
                      {paragraph.slice(3)}
                    </h2>
                  );
                }
                if (paragraph.startsWith("### ")) {
                  return (
                    <h3 key={i} className="text-lg font-medium mt-6 mb-3">
                      {paragraph.slice(4)}
                    </h3>
                  );
                }
                return (
                  <p key={i} className="text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 bg-[oklch(0.975_0.006_80)] rounded-2xl p-8 text-center">
            <h3
              className="text-2xl text-foreground"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Etkinliğini planlamaya hazır mısın?
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Deneyim planlayıcısını kullan, sana özel teklif alalım.
            </p>
            <Link
              href="/planla"
              className="inline-flex items-center gap-2 mt-5 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Planlamaya Başla
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
