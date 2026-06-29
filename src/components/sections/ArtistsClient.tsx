"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PERFORMER_TYPES = [
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
  preview_video_url?: string | null;
  videos?: string[] | null;
  youtube_links?: string[] | null;
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
  return m ? m[1] : null;
}

// ─── Video thumbnail + inline play ───────────────────────────────────────────
function VideoThumb({ url, isYoutube, youtubeId }: { url: string; isYoutube?: boolean; youtubeId?: string }) {
  const [ytPlaying, setYtPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Callback ref: set muted=true on the DOM element immediately at creation
  // (React's `muted` prop is a known bug — it doesn't reflect to DOM, blocking Chrome autoplay)
  const setVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) el.muted = true;
  };

  // Autoplay when scrolled into view, pause when leaving
  useEffect(() => {
    if (isYoutube) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          video.muted = true;
          setMuted(true);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(wrap);
    return () => obs.disconnect();
  }, [isYoutube]);

  if (isYoutube && youtubeId) {
    return (
      <div
        className="w-full aspect-video bg-black relative"
        onClick={(e) => e.stopPropagation()}
      >
        {ytPlaying ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <button
            className="w-full h-full relative block"
            onClick={(e) => { e.stopPropagation(); setYtPlaying(true); }}
          >
            <Image
              src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </span>
            </span>
            <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">YT</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="w-full aspect-video bg-black relative overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <video
        ref={setVideoRef}
        src={url}
        playsInline
        loop
        className="w-full h-full object-cover"
      />
      {/* Transparent overlay — captures all taps to toggle mute, prevents Link navigation */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          const v = videoRef.current;
          if (!v) return;
          const next = !v.muted;
          v.muted = next;
          setMuted(next);
        }}
      />
      {/* Mute indicator */}
      <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
        <span className="bg-black/60 backdrop-blur-sm rounded-full p-1.5 flex items-center justify-center">
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          )}
        </span>
      </div>
    </div>
  );
}

// ─── Horizontal photo strip ───────────────────────────────────────────────────
function PhotoStrip({ photos, focalPoints, name }: { photos: string[]; focalPoints?: Record<string, { x: number; y: number }>; name: string }) {
  if (photos.length === 0) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 pb-1">
      {photos.map((url, i) => {
        const fp = focalPoints?.[url] ?? { x: 50, y: 50 };
        return (
          <div key={i} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden relative bg-secondary">
            <Image
              src={url}
              alt={`${name} ${i + 1}`}
              fill
              className="object-cover"
              style={{ objectPosition: `${fp.x}% ${fp.y}%` }}
              sizes="64px"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Artist card ──────────────────────────────────────────────────────────────
function ArtistCard({ dj, index }: { dj: Dj; index: number }) {
  const BG_COLORS = [
    "bg-[oklch(0.88_0.05_75)]",
    "bg-[oklch(0.92_0.02_320)]",
    "bg-[oklch(0.94_0.01_200)]",
    "bg-[oklch(0.91_0.025_160)]",
    "bg-[oklch(0.90_0.04_55)]",
    "bg-[oklch(0.93_0.008_280)]",
  ];
  const bgColor = BG_COLORS[index % BG_COLORS.length];

  const allPhotos = Array.isArray(dj.photos) && dj.photos.length > 0 ? dj.photos : dj.photo_url ? [dj.photo_url] : [];
  const allVideos: string[] = Array.isArray(dj.videos) && dj.videos.length > 0 ? dj.videos : dj.preview_video_url ? [dj.preview_video_url] : [];
  const youtubeLinks: string[] = Array.isArray(dj.youtube_links) ? dj.youtube_links : [];

  // First video source — uploaded takes priority, then YouTube
  const firstVideo = allVideos[0] ?? null;
  const firstYtId = !firstVideo && youtubeLinks.length > 0 ? getYouTubeId(youtubeLinks[0]) : null;
  const hasVideo = !!(firstVideo || firstYtId);

  const initials = dj.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const typeInfo = PERFORMER_TYPES.find((pt) => pt.id === (dj.performer_type ?? "dj"));

  const links = [
    { url: dj.soundcloud_url, label: "SC" },
    { url: dj.mixcloud_url, label: "MC" },
    { url: dj.youtube_url, label: "YT" },
    { url: dj.instagram_url, label: "IG" },
    { url: dj.spotify_url, label: "SP" },
  ].filter((l) => l.url);

  return (
    <Link href={`/sanatcilar/${dj.id}`} className="block group">
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-foreground/20 transition-all hover:shadow-md">

        {/* Video — full width, 16:9 */}
        {hasVideo ? (
          firstVideo
            ? <VideoThumb url={firstVideo} />
            : <VideoThumb isYoutube youtubeId={firstYtId!} url="" />
        ) : (
          /* No video → show first photo in 16:9 or initials */
          <div className={`w-full aspect-video relative ${allPhotos.length === 0 ? bgColor : "bg-secondary"} flex items-center justify-center`}>
            {allPhotos.length > 0 ? (
              <Image
                src={allPhotos[0]}
                alt={dj.name}
                fill
                className="object-cover"
                style={{ objectPosition: `${(dj.focal_points?.[allPhotos[0]] ?? { x: 50, y: 50 }).x}% ${(dj.focal_points?.[allPhotos[0]] ?? { x: 50, y: 50 }).y}%` }}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <span className="text-5xl font-light text-foreground/20" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>{initials}</span>
            )}
          </div>
        )}

        {/* Photo strip — show remaining photos (skip first if no video, else show all) */}
        {(() => {
          const stripPhotos = hasVideo ? allPhotos : allPhotos.slice(1);
          return stripPhotos.length > 0 ? (
            <div className="pt-2.5">
              <PhotoStrip photos={stripPhotos.slice(0, 6)} focalPoints={dj.focal_points} name={dj.name} />
            </div>
          ) : null;
        })()}

        {/* Info */}
        <div className="px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-base truncate">{dj.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {[
                dj.city ? `📍 ${dj.city}` : null,
                typeInfo && typeInfo.id !== "dj" ? `${typeInfo.emoji} ${typeInfo.label}` : null,
                dj.speciality ?? null,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {links.slice(0, 3).map((l) => (
              <a
                key={l.label}
                href={l.url!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] px-2 py-1 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ArtistsClient({ djs, activeType }: { djs: Dj[]; activeType?: string | null }) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="mb-10">
        <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">Kadromuz</span>
        <h1 className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}>
          Sanatçılar
        </h1>
        <p className="text-muted-foreground mt-4 max-w-lg leading-relaxed">
          Her etkinlik için doğru sanatçıyla buluşturuyoruz. Müzik tercihiniz, kitleniz ve hayal ettiğiniz atmosfer — hepsini göz önünde bulundurarak sizi eşleştiriyoruz.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-12">
        {PERFORMER_TYPES.map((pt) => {
          const isActive = pt.id === activeType;
          return (
            <button
              key={pt.id}
              onClick={() => router.push(`/sanatcilar?type=${pt.id}`)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${isActive ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"}`}
            >
              <span>{pt.emoji}</span>
              {pt.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {djs.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg">Bu kategoride sanatçı bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {djs.map((dj, i) => (
            <motion.div key={dj.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}>
              <ArtistCard dj={dj} index={i} />
            </motion.div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-20 bg-[oklch(0.975_0.006_80)] rounded-2xl p-10 text-center">
        <h3 className="text-3xl text-foreground" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}>
          Hangi sanatçının sana uygun olduğundan emin değil misin?
        </h3>
        <p className="text-muted-foreground mt-3 text-sm">Deneyim planlayıcısını kullan, sana özel sanatçı önerisi yapalım.</p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
          <Link href="/planla" className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
            Deneyim Planlayıcısını Başlat
          </Link>
          <Link href="/basvuru/sanatci" className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors">
            Sanatçı Başvurusu
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-accent/40 p-8 text-center">
        <p className="text-sm text-muted-foreground mb-1">DJ olmak ister misin?</p>
        <h3 className="text-xl font-medium text-foreground">Eğitim ve topluluk için noqta.club</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          DJ ve prodüksiyon eğitimi, elektronik müzik topluluğu ve etkinlik deneyimi — noqta.club&apos;da başla.
        </p>
        <a href="https://www.noqta.club/academy" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-5 border border-border text-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-accent transition-colors">
          noqta.club Academy →
        </a>
      </div>
    </div>
  );
}
