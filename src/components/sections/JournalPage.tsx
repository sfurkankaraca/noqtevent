"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const categories = [
  "Düğün Müziği",
  "Düğün Planlama",
  "İlk Dans Şarkıları",
  "Giriş Şarkıları",
  "After Party Fikirleri",
  "Kurumsal Etkinlik",
  "Açılış Etkinliği",
  "Etkinlik Tasarımı",
  "Müzik Kültürü",
  "Mekan Rehberleri",
];

const posts = [
  {
    id: "ilk-dans-sarkilari-2025",
    title: "2025'in En İyi İlk Dans Şarkıları",
    category: "İlk Dans Şarkıları",
    readTime: "5 dk",
    date: "12 Ocak 2025",
    excerpt:
      "Düğününüzün en özel anını taçlandıracak, hem duygusal hem de dans ettirici ilk dans şarkısı nasıl seçilir?",
    featured: true,
    color: "bg-[oklch(0.88_0.05_75)]",
  },
  {
    id: "dans-pistini-dolu-tutmak",
    title: "Dans Pistini Hiç Boş Bırakmayan 7 Strateji",
    category: "Düğün Müziği",
    readTime: "7 dk",
    date: "8 Ocak 2025",
    excerpt:
      "Misafirlerinizin dans pistini terk etmemesi için DJ'inizle nasıl çalışmalısınız? Profesyonel stratejiler.",
    featured: false,
    color: "bg-[oklch(0.92_0.02_320)]",
  },
  {
    id: "sunset-session-rehber",
    title: "Mükemmel Sunset Session Nasıl Planlanır?",
    category: "Etkinlik Tasarımı",
    readTime: "6 dk",
    date: "3 Ocak 2025",
    excerpt:
      "Gün batımı etkinlikleri atmosfer oyunu demektir. Işık, müzik ve zamanlama üçgeni.",
    featured: false,
    color: "bg-[oklch(0.94_0.01_200)]",
  },
  {
    id: "istanbul-mekan-rehberi",
    title: "İstanbul'un En İyi Düğün Mekanları 2025",
    category: "Mekan Rehberleri",
    readTime: "10 dk",
    date: "28 Aralık 2024",
    excerpt:
      "Boğaz kıyısından tarihi köşklere, modern loft'lardan villa bahçelerine. İstanbul'un öne çıkan düğün mekanları.",
    featured: false,
    color: "bg-[oklch(0.91_0.025_160)]",
  },
  {
    id: "after-party-fikirleri",
    title: "After Party Fikirlerini Bir Üst Seviyeye Taşıyın",
    category: "After Party Fikirleri",
    readTime: "4 dk",
    date: "20 Aralık 2024",
    excerpt:
      "Düğün bittikten sonra gece devam ediyor. After party'yi unutulmaz kılacak detaylar.",
    featured: false,
    color: "bg-[oklch(0.12_0.008_45)]",
    darkCard: true,
  },
  {
    id: "kurumsal-etkinlik-muzik",
    title: "Kurumsal Etkinliklerde Müzik Seçimi",
    category: "Kurumsal Etkinlik",
    readTime: "5 dk",
    date: "15 Aralık 2024",
    excerpt:
      "Network etkinliklerinden ürün lansmanlarına, müziğin kurumsal atmosfere katkısı.",
    featured: false,
    color: "bg-[oklch(0.97_0.003_60)]",
  },
];

export default function JournalPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = posts.filter(
    (p) => !activeCategory || p.category === activeCategory
  );
  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="mb-16">
        <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
          İçerik
        </span>
        <h1
          className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Journal
        </h1>
        <p className="text-muted-foreground mt-4 max-w-lg leading-relaxed">
          Düğün müziğinden etkinlik tasarımına, mekan rehberlerinden kültür
          yazılarına. Deneyim dünyasına dair her şey.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-12 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
            !activeCategory ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
          }`}
        >
          Tümü
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
              activeCategory === cat ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured post */}
      {featured && (
        <motion.div
          layout
          className="mb-8"
        >
          <Link href={`/journal/${featured.id}`} className="block group">
            <div className={`${featured.color} rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row gap-8 items-end justify-between min-h-64`}>
              <div className="max-w-xl">
                <span className="text-xs font-medium px-3 py-1 bg-background/20 backdrop-blur-sm rounded-full text-foreground">
                  {featured.category}
                </span>
                <h2
                  className="text-3xl lg:text-4xl mt-4 text-foreground leading-tight group-hover:opacity-80 transition-opacity"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                >
                  {featured.title}
                </h2>
                <p className="text-foreground/70 mt-3 leading-relaxed">{featured.excerpt}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-foreground/60 flex-shrink-0">
                <span>{featured.date}</span>
                <span>·</span>
                <span>{featured.readTime} okuma</span>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Post grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rest.map((post, i) => (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link href={`/journal/${post.id}`} className="block group">
              <div className={`${post.color} rounded-2xl p-6 h-56 flex flex-col justify-between transition-transform group-hover:scale-[1.02] duration-300`}>
                <div>
                  <span className={`text-xs font-medium ${post.darkCard ? "text-background/60" : "text-muted-foreground"}`}>
                    {post.category}
                  </span>
                  <h3
                    className={`text-xl mt-3 leading-snug ${post.darkCard ? "text-background" : "text-foreground"}`}
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {post.title}
                  </h3>
                </div>
                <div className={`text-xs ${post.darkCard ? "text-background/50" : "text-muted-foreground"} flex gap-3`}>
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
