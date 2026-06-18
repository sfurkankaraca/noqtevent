import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { createServiceClient } from "@/lib/supabase";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: p } = await supabase.from("journal_posts").select("title, excerpt").eq("slug", slug).single();
  if (!p) return { title: "Yazı Bulunamadı" };
  return { title: `${p.title} — NOQT Journal`, description: p.excerpt ?? undefined };
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

  return (
    <>
      <Navigation />
      <main className="pt-20">
        {/* Hero */}
        {post.cover_image_url && (
          <div className={`relative h-72 lg:h-96 ${post.color ?? "bg-secondary"}`}>
            <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" unoptimized />
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
