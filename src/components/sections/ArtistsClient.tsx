"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PERFORMER_TYPES = [
  { id: "all", label: "Tümü", emoji: "✨" },
  { id: "dj", label: "DJ", emoji: "🎧" },
  { id: "artist", label: "Solo Sanatçı", emoji: "🎤" },
  { id: "trio", label: "Trio / Grup", emoji: "🎶" },
  { id: "dance", label: "Dans Ekibi", emoji: "💃" },
  { id: "band", label: "Bando / Orkestra", emoji: "🎺" },
  { id: "host", label: "Sunucu / MC", emoji: "🎙️" },
  { id: "moderator", label: "Moderatör", emoji: "🗣️" },
];

type Dj = {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  photos?: string[];
  focal_points?: Record<string, { x: number; y: number }>;
  concept_tags: string[];
  soundcloud_url: string | null;
  mixcloud_url: string | null;
  youtube_url: string | null;
  instagram_url?: string | null;
  spotify_url?: string | null;
  website_url?: string | null;
  performer_type?: string | null;
  city?: string | null;
  speciality?: string | null;
};

export default function ArtistsClient({
  djs,
  activeType,
}: {
  djs: Dj[];
  activeType?: string | null;
}) {
  const router = useRouter();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = [...new Set(djs.flatMap((d) => d.concept_tags))].sort();

  const filtered = djs.filter(
    (d) => !activeTag || d.concept_tags.includes(activeTag)
  );

  const BG_COLORS = [
    "bg-[oklch(0.88_0.05_75)]",
    "bg-[oklch(0.92_0.02_320)]",
    "bg-[oklch(0.94_0.01_200)]",
    "bg-[oklch(0.91_0.025_160)]",
    "bg-[oklch(0.90_0.04_55)]",
    "bg-[oklch(0.93_0.008_280)]",
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="mb-10">
        <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
          Kadromuz
        </span>
        <h1
          className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Sanatçılar
        </h1>
        <p className="text-muted-foreground mt-4 max-w-lg leading-relaxed">
          Her etkinlik için doğru sanatçıyla buluşturuyoruz. Müzik tercihiniz,
          kitleniz ve hayal ettiğiniz atmosfer — hepsini göz önünde bulundurarak
          sizi eşleştiriyoruz.
        </p>
      </div>

      {/* Performer type tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {PERFORMER_TYPES.map((pt) => {
          const isActive = (pt.id === "all" && !activeType) || pt.id === activeType;
          return (
            <button
              key={pt.id}
              onClick={() =>
                router.push(`/sanatcilar${pt.id !== "all" ? `?type=${pt.id}` : ""}`)
              }
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              <span>{pt.emoji}</span>
              {pt.label}
            </button>
          );
        })}
      </div>

      {/* Concept tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              !activeTag
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            Tüm Stiller
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeTag === tag
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg">Bu kritere uygun sanatçı bulunamadı.</p>
          <button
            onClick={() => setActiveTag(null)}
            className="mt-4 text-sm text-foreground underline"
          >
            Filtreyi temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dj, i) => {
            const bgColor = BG_COLORS[i % BG_COLORS.length];
            const initials = dj.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const typeInfo = PERFORMER_TYPES.find((pt) => pt.id === (dj.performer_type ?? "dj"));

            const links = [
              { url: dj.soundcloud_url, label: "SC" },
              { url: dj.mixcloud_url, label: "MC" },
              { url: dj.youtube_url, label: "YT" },
              { url: dj.instagram_url, label: "IG" },
              { url: dj.spotify_url, label: "SP" },
              { url: dj.website_url, label: "Web" },
            ].filter((l) => l.url);

            return (
              <motion.div
                key={dj.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-foreground/20 transition-all hover:shadow-lg group">
                  {/* Photo / avatar */}
                  <div className={`${bgColor} h-56 relative flex items-center justify-center`}>
                    {dj.photo_url ? (
                      <Image
                        src={dj.photo_url}
                        alt={dj.name}
                        fill
                        className="object-cover"
                        style={{
                          objectPosition: (() => {
                            const cover = dj.photos?.[0] ?? dj.photo_url;
                            const fp = cover ? (dj.focal_points?.[cover] ?? { x: 50, y: 50 }) : { x: 50, y: 50 };
                            return `${fp.x}% ${fp.y}%`;
                          })(),
                        }}
                        unoptimized
                      />
                    ) : (
                      <span
                        className="text-5xl font-light text-foreground/30"
                        style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                      >
                        {initials}
                      </span>
                    )}

                    {/* Type badge */}
                    {typeInfo && typeInfo.id !== "dj" && (
                      <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        {typeInfo.emoji} {typeInfo.label}
                      </span>
                    )}

                    {/* External links */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {links.slice(0, 3).map((l) => (
                        <a
                          key={l.label}
                          href={l.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-background/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-medium text-foreground hover:bg-background transition-colors"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-2">
                      <h2 className="font-medium text-foreground text-lg">{dj.name}</h2>
                      {(dj.city || dj.speciality) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[dj.city ? `📍 ${dj.city}` : null, dj.speciality].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>

                    {dj.bio && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                        {dj.bio}
                      </p>
                    )}

                    {dj.concept_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {dj.concept_tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2.5 py-1 bg-secondary rounded-full text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <Link
                        href={`/sanatcilar/${dj.id}`}
                        className="text-xs font-medium text-foreground hover:text-muted-foreground transition-colors"
                      >
                        Profil →
                      </Link>
                      <Link
                        href="/planla"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Planla
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-20 bg-[oklch(0.975_0.006_80)] rounded-2xl p-10 text-center">
        <h3
          className="text-3xl text-foreground"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Hangi sanatçının sana uygun olduğundan emin değil misin?
        </h3>
        <p className="text-muted-foreground mt-3 text-sm">
          Deneyim planlayıcısını kullan, sana özel sanatçı önerisi yapalım.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
          <Link
            href="/planla"
            className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Deneyim Planlayıcısını Başlat
          </Link>
          <Link
            href="/basvuru/sanatci"
            className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors"
          >
            Sanatçı Başvurusu
          </Link>
        </div>
      </div>
    </div>
  );
}
