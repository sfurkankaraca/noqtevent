"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Music } from "lucide-react";

const artists = [
  {
    id: "mert-yilmaz",
    name: "Mert Yılmaz",
    role: "DJ & Prodüktör",
    bio: "10 yılı aşkın deneyimiyle deep house ve organic house müziğin ülkemizdeki öncülerinden. İstanbul başta olmak üzere Avrupa sahne deneyimine sahip.",
    styles: ["Deep House", "Organic House", "Melodic"],
    specialties: ["Düğün", "Sunset Session", "Kokteyl"],
    initials: "MY",
    color: "bg-[oklch(0.88_0.05_75)]",
    instagram: "@mertyilmazmusic",
  },
  {
    id: "elif-kaya",
    name: "Elif Kaya",
    role: "DJ",
    bio: "Disco ve funk köklerinden beslenen, nu-disco sahnesiyle tanınan Elif, dans pistini asla boş bırakmaz. Düğün ve after party uzmanı.",
    styles: ["Disco", "Funk", "Nu-Disco"],
    specialties: ["After Party", "Özel Parti", "Düğün Gecesi"],
    initials: "EK",
    color: "bg-[oklch(0.92_0.02_320)]",
    instagram: "@elifkaya.dj",
  },
  {
    id: "can-demir",
    name: "Can Demir",
    role: "DJ & Live Act",
    styles: ["Techno", "Minimal House", "Electronica"],
    bio: "Tekno sahnesinin güçlü isimlerinden Can, kurumsal etkinlikler ve açılış gecelerinde tercih edilen bir performansçı.",
    specialties: ["Kurumsal", "Açılış", "Brand Launch"],
    initials: "CD",
    color: "bg-[oklch(0.94_0.01_200)]",
    instagram: "@candemir.live",
  },
  {
    id: "zeynep-arslan",
    name: "Zeynep Arslan",
    role: "Live Vocalist & DJ",
    bio: "Jazz vokal ve DJ yeteneklerini birleştiren nadir isimlerden. Kokteyl resepsiyonları ve düğün törenlerinin vazgeçilmezi.",
    styles: ["Jazz", "Soul", "Deep House"],
    specialties: ["Kokteyl Resepsiyonu", "Düğün Töreni", "Akustik Set"],
    initials: "ZA",
    color: "bg-[oklch(0.91_0.025_160)]",
    instagram: "@zeyneparslan.music",
  },
  {
    id: "bora-sen",
    name: "Bora Şen",
    role: "DJ",
    bio: "Afrobeat ve latin ritimlerle şekillenen setleriyle, dansın durdurulamadığı etkinlikler yaratıyor. Beach club ve villa partilerin aranan ismi.",
    styles: ["Afrobeat", "Latin", "Tropical"],
    specialties: ["Beach Club", "Villa Weekend", "Açık Hava"],
    initials: "BŞ",
    color: "bg-[oklch(0.90_0.04_55)]",
    instagram: "@borasen.dj",
  },
  {
    id: "ada-kurt",
    name: "Ada Kurt",
    role: "DJ & Producer",
    bio: "Elektronik müziğin sınırlarını zorlayan Ada, marka lansmanları ve yaratıcı topluluklara yönelik etkinliklerin en çok tercih ettiği sanatçısı.",
    styles: ["Electronic", "Ambient", "Experimental"],
    specialties: ["Marka Lansmanı", "Yaratıcı Etkinlik", "Sergi Açılışı"],
    initials: "AK",
    color: "bg-[oklch(0.93_0.008_280)]",
    instagram: "@adakurtmusic",
  },
];

const allStyles = [...new Set(artists.flatMap((a) => a.styles))];
const allSpecialties = [...new Set(artists.flatMap((a) => a.specialties))];

export default function ArtistsPage() {
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<string | null>(null);

  const filtered = artists.filter((a) => {
    if (styleFilter && !a.styles.includes(styleFilter)) return false;
    if (specialtyFilter && !a.specialties.includes(specialtyFilter)) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="mb-16">
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

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-12">
        <div>
          <p className="text-xs text-muted-foreground mb-2 tracking-wide">Müzik Stili</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStyleFilter(null)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                !styleFilter ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              Tümü
            </button>
            {allStyles.map((s) => (
              <button
                key={s}
                onClick={() => setStyleFilter(styleFilter === s ? null : s)}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                  styleFilter === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 tracking-wide">Etkinlik Tipi</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSpecialtyFilter(null)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                !specialtyFilter ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              Tümü
            </button>
            {allSpecialties.slice(0, 8).map((s) => (
              <button
                key={s}
                onClick={() => setSpecialtyFilter(specialtyFilter === s ? null : s)}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                  specialtyFilter === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Artist grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((artist, i) => (
          <motion.div
            key={artist.id}
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-foreground/20 transition-all hover:shadow-lg group">
              {/* Avatar */}
              <div className={`${artist.color} h-56 flex items-center justify-center relative`}>
                <span
                  className="text-5xl font-light text-foreground/30"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                >
                  {artist.initials}
                </span>
                <a
                  href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Instagram"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-medium text-foreground text-lg">{artist.name}</h2>
                    <p className="text-sm text-muted-foreground">{artist.role}</p>
                  </div>
                  <button className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Playlist">
                    <Music size={16} className="text-muted-foreground" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-2">
                  {artist.bio}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {artist.styles.map((style) => (
                    <span key={style} className="text-xs px-2.5 py-1 bg-secondary rounded-full text-muted-foreground">
                      {style}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {artist.specialties.slice(0, 2).join(" · ")}
                  </p>
                  <Link
                    href={`/planla?artist=${artist.id}`}
                    className="text-xs font-medium text-foreground hover:text-muted-foreground transition-colors"
                  >
                    Seç →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg">Bu kriterlere uygun sanatçı bulunamadı.</p>
          <button
            onClick={() => { setStyleFilter(null); setSpecialtyFilter(null); }}
            className="mt-4 text-sm text-foreground underline"
          >
            Filtreleri temizle
          </button>
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
        <Link
          href="/planla"
          className="inline-flex items-center gap-2 mt-6 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Deneyim Planlayıcısını Başlat
        </Link>
      </div>
    </div>
  );
}
