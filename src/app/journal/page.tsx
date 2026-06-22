import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import JournalPage from "@/components/sections/JournalPage";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Journal — Düğün ve Etkinlik Rehberi",
  description:
    "Kayseri ve Nevşehir'de düğün müziği, DJ seçimi, kına gecesi, after party ve etkinlik organizasyonu hakkında uzman rehberleri.",
  keywords: [
    "kayseri düğün rehberi",
    "nevşehir düğün ipuçları",
    "düğün dj seçimi",
    "kapadokya düğün organizasyonu",
    "kına gecesi müziği",
    "kayseri after party",
  ],
  alternates: { canonical: "https://www.noqt.events/journal" },
};

export default async function Page() {
  const supabase = createServiceClient();
  const { data: posts } = await supabase
    .from("journal_posts")
    .select("id, slug, title, category, excerpt, cover_image_url, color, read_time, is_featured, published_at")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  const hasPosts = posts && posts.length > 0;

  if (!hasPosts) {
    return (
      <>
        <Navigation />
        <main className="pt-20"><JournalPage /></main>
        <Footer />
      </>
    );
  }

  const featured = posts.find((p) => p.is_featured) ?? posts[0];
  const rest = posts.filter((p) => p.id !== featured.id);

  return (
    <>
      <Navigation />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="mb-16">
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">Yazılar</span>
            <h1
              className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Journal
            </h1>
          </div>

          {/* Featured post */}
          <Link href={`/journal/${featured.slug}`} className="group block mb-12">
            <div className={`rounded-2xl overflow-hidden ${featured.color ?? "bg-secondary"} grid grid-cols-1 lg:grid-cols-2 min-h-[360px]`}>
              <div className="relative min-h-[240px]">
                {featured.cover_image_url ? (
                  <Image src={featured.cover_image_url} alt={featured.title} fill className="object-cover" unoptimized />
                ) : null}
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center bg-white">
                {featured.category && (
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{featured.category}</span>
                )}
                <h2
                  className="text-3xl lg:text-4xl mt-3 text-foreground leading-tight group-hover:opacity-80 transition-opacity"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                >
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-muted-foreground mt-4 leading-relaxed line-clamp-3">{featured.excerpt}</p>
                )}
                <div className="flex items-center gap-3 mt-6 text-xs text-muted-foreground">
                  {featured.read_time && <span>{featured.read_time} okuma</span>}
                  {featured.published_at && (
                    <span>{new Date(featured.published_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link key={post.id} href={`/journal/${post.slug}`} className="group block">
                  <div className="rounded-2xl overflow-hidden border border-border hover:border-foreground/15 hover:shadow-md transition-all">
                    <div className={`relative h-48 ${post.color ?? "bg-secondary"}`}>
                      {post.cover_image_url ? (
                        <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" unoptimized />
                      ) : null}
                    </div>
                    <div className="p-5 bg-white">
                      {post.category && (
                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{post.category}</span>
                      )}
                      <h3 className="font-medium text-foreground mt-1.5 group-hover:opacity-70 transition-opacity line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                        {post.read_time && <span>{post.read_time}</span>}
                        {post.published_at && <span>{new Date(post.published_at).toLocaleDateString("tr-TR")}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
