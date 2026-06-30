"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ArtistBookingWizard from "@/components/artist-booking/ArtistBookingWizard";

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

// Proxy R2 videos through same origin to avoid CDN/range-request issues on desktop browsers
function proxyVideo(url: string): string {
  if (!url || !url.includes("media.noqt.events")) return url;
  return `/api/video?url=${encodeURIComponent(url)}`;
}

// ─── Video thumbnail + inline play ───────────────────────────────────────────
function VideoThumb({ url: rawUrl, isYoutube, youtubeId }: { url: string; isYoutube?: boolean; youtubeId?: string }) {
  const url = proxyVideo(rawUrl);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [desktopPlaying, setDesktopPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // Tracks whether user explicitly unmuted — prevents IntersectionObserver from re-muting
  const userUnmutedRef = useRef(false);

  useEffect(() => {
    setIsDesktop(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  // Callback ref: set muted immediately (React muted prop bug workaround)
  const setVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) el.muted = true;
  };

  // Mobile only: autoplay on scroll; preload when nearby
  useEffect(() => {
    if (isDesktop || isYoutube) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Start buffering early — when video is within 400px of viewport
    const preloadObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const video = videoRef.current;
          if (video && video.preload !== "auto") video.preload = "auto";
          preloadObs.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    preloadObs.observe(wrap);

    // Play/pause when in view
    const playObs = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          if (!userUnmutedRef.current) {
            video.muted = true;
            setMuted(true);
          }
          video.play().catch(() => {});
        } else {
          video.pause();
          userUnmutedRef.current = false;
        }
      },
      { threshold: 0.5 }
    );
    playObs.observe(wrap);
    return () => { preloadObs.disconnect(); playObs.disconnect(); };
  }, [isDesktop, isYoutube]);

  // ── YouTube ────────────────────────────────────────────────────────────────
  if (isYoutube && youtubeId) {
    return (
      <div className="w-full aspect-video bg-black relative" onClick={(e) => e.stopPropagation()}>
        {ytPlaying ? (
          <iframe src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="w-full h-full" />
        ) : (
          <button className="w-full h-full relative block" onClick={(e) => { e.stopPropagation(); setYtPlaying(true); }}>
            <Image src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
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

  // ── Desktop: click to play ─────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="w-full aspect-video bg-zinc-900 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {desktopPlaying ? (
          <video src={url} controls autoPlay playsInline className="w-full h-full object-cover" onClick={(e) => e.stopPropagation()} />
        ) : (
          <button
            className="w-full h-full flex items-center justify-center group/play"
            onClick={(e) => { e.stopPropagation(); setDesktopPlaying(true); }}
          >
            <span className="w-14 h-14 bg-white/15 group-hover/play:bg-white/25 transition-colors rounded-full flex items-center justify-center border border-white/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </span>
          </button>
        )}
      </div>
    );
  }

  // ── Mobile: muted autoplay on scroll ──────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      className="w-full aspect-video bg-black relative overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <video
        ref={setVideoRef}
        src={`${rawUrl}#t=0.001`}
        playsInline
        loop
        preload="none"
        className="w-full h-full object-cover"
        onCanPlay={() => setBuffering(false)}
        onWaiting={() => setBuffering(true)}
      />
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      )}
      <button
        className="absolute bottom-2 right-2 z-20 bg-black/60 backdrop-blur-sm rounded-full p-1.5 flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          const v = videoRef.current;
          if (!v) return;
          const next = !v.muted;
          v.muted = next;
          userUnmutedRef.current = !next;
          if (!next) v.play().catch(() => {});
          setMuted(next);
        }}
      >
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
      </button>
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

// ─── Quick view sheet ─────────────────────────────────────────────────────────
function ArtistQuickView({ dj, onClose, onBooking }: { dj: Dj; onClose: () => void; onBooking: () => void }) {
  const allPhotos = Array.isArray(dj.photos) && dj.photos.length > 0 ? dj.photos : dj.photo_url ? [dj.photo_url] : [];
  const allVideos: string[] = Array.isArray(dj.videos) && dj.videos.length > 0 ? dj.videos : dj.preview_video_url ? [dj.preview_video_url] : [];
  const youtubeLinks: string[] = Array.isArray(dj.youtube_links) ? dj.youtube_links : [];

  // Media items: videos first, then photos
  type MediaItem =
    | { kind: "video"; url: string }
    | { kind: "youtube"; id: string }
    | { kind: "photo"; url: string; fp: { x: number; y: number } };

  const mediaItems: MediaItem[] = [
    ...allVideos.map((url) => ({ kind: "video" as const, url })),
    ...youtubeLinks.flatMap((url) => {
      const id = getYouTubeId(url);
      return id ? [{ kind: "youtube" as const, id }] : [];
    }),
    ...allPhotos.map((url) => ({ kind: "photo" as const, url, fp: dj.focal_points?.[url] ?? { x: 50, y: 50 } })),
  ];

  const [idx, setIdx] = useState(0);
  const current = mediaItems[idx];
  const initials = dj.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const typeInfo = PERFORMER_TYPES.find((pt) => pt.id === (dj.performer_type ?? "dj"));

  const allLinks = [
    { url: dj.soundcloud_url, label: "SoundCloud" },
    { url: dj.mixcloud_url, label: "Mixcloud" },
    { url: dj.youtube_url, label: "YouTube" },
    { url: dj.instagram_url, label: "Instagram" },
    { url: dj.spotify_url, label: "Spotify" },
    { url: dj.website_url, label: "Web Sitesi" },
  ].filter((l) => l.url);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + mediaItems.length) % mediaItems.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % mediaItems.length);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, mediaItems.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        initial={{ y: "100%", scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: "100%", scale: 0.98 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        {/* Media area */}
        <div className="w-full aspect-[4/3] relative bg-black flex-shrink-0">
          {!current ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl font-light text-white/20" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>{initials}</span>
            </div>
          ) : current.kind === "photo" ? (
            <Image src={current.url} alt={dj.name} fill className="object-cover" style={{ objectPosition: `${current.fp.x}% ${current.fp.y}%` }} sizes="(max-width: 640px) 100vw, 384px" />
          ) : current.kind === "video" ? (
            <video src={current.url} controls playsInline preload="metadata" className="w-full h-full object-cover" />
          ) : (
            <iframe src={`https://www.youtube.com/embed/${current.id}?autoplay=1`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="w-full h-full" />
          )}

          {/* Prev / Next arrows */}
          {mediaItems.length > 1 && (
            <>
              <button onClick={() => setIdx((i) => (i - 1 + mediaItems.length) % mediaItems.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button onClick={() => setIdx((i) => (i + 1) % mediaItems.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {mediaItems.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`} />
                ))}
              </div>
            </>
          )}

          {/* Close */}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Info — scrollable */}
        <div className="px-5 pt-4 pb-5 overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-xl font-semibold text-foreground leading-tight">{dj.name}</h2>
            {typeInfo && <span className="text-sm text-muted-foreground flex-shrink-0">{typeInfo.emoji} {typeInfo.label}</span>}
          </div>
          {dj.city && <p className="text-sm text-muted-foreground mb-3">📍 {dj.city}</p>}
          {dj.bio && <p className="text-sm text-foreground/80 leading-relaxed mb-4 line-clamp-4">{dj.bio}</p>}
          {dj.concept_tags && dj.concept_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {dj.concept_tags.slice(0, 6).map((tag) => (
                <span key={tag} className="text-[11px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
          {allLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {allLinks.map((l) => (
                <a key={l.label} href={l.url!} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <button
              onClick={onBooking}
              className="flex items-center justify-center gap-2 w-full py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Bu Sanatçıyla Planla
            </button>
            <Link href={`/sanatcilar/${dj.id}`}
              className="flex items-center justify-center gap-2 w-full py-3 border border-border text-foreground rounded-xl font-medium text-sm hover:bg-foreground/5 transition-colors">
              Tam Profili Gör
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
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

  // Build ordered video list: uploaded first, then YouTube
  const videoSources: Array<{ type: "upload"; url: string } | { type: "youtube"; id: string; url: string }> = [
    ...allVideos.map((url) => ({ type: "upload" as const, url })),
    ...youtubeLinks.flatMap((url) => {
      const id = getYouTubeId(url);
      return id ? [{ type: "youtube" as const, id, url }] : [];
    }),
  ];
  const hasVideo = videoSources.length > 0;

  const [vidIdx, setVidIdx] = useState(0);
  const [quickOpen, setQuickOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const currentVid = videoSources[vidIdx] ?? null;

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
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-foreground/20 transition-all hover:shadow-md">

      {/* Video / cover — full width 16:9, no Link wrapper */}
      <div className="relative">
        {hasVideo && currentVid ? (
          currentVid.type === "upload"
            ? <VideoThumb key={currentVid.url} url={currentVid.url} />
            : <VideoThumb key={currentVid.id} isYoutube youtubeId={currentVid.id} url="" />
        ) : (
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

        {/* Prev / Next arrows — only when there are multiple videos */}
        {videoSources.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              onClick={(e) => { e.stopPropagation(); setVidIdx((i) => (i - 1 + videoSources.length) % videoSources.length); }}
              aria-label="Önceki video"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              onClick={(e) => { e.stopPropagation(); setVidIdx((i) => (i + 1) % videoSources.length); }}
              aria-label="Sonraki video"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex gap-1">
              {videoSources.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === vidIdx ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Photo strip */}
      {(() => {
        const stripPhotos = hasVideo ? allPhotos : allPhotos.slice(1);
        return stripPhotos.length > 0 ? (
          <div className="pt-2.5">
            <PhotoStrip photos={stripPhotos.slice(0, 6)} focalPoints={dj.focal_points} name={dj.name} />
          </div>
        ) : null;
      })()}

      {/* Info row — opens quick view */}
      <button
        onClick={() => setQuickOpen(true)}
        className="w-full text-left px-4 py-3.5 hover:bg-foreground/5 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-secondary relative">
              {allPhotos[0] ? (
                <Image
                  src={allPhotos[0]}
                  alt={dj.name}
                  fill
                  className="object-cover"
                  style={{ objectPosition: `${(dj.focal_points?.[allPhotos[0]] ?? { x: 50, y: 50 }).x}% ${(dj.focal_points?.[allPhotos[0]] ?? { x: 50, y: 50 }).y}%` }}
                  sizes="40px"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-sm font-medium text-foreground/40">{initials}</span>
              )}
            </div>
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
          </div>
          <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
      </button>

      {/* Book CTA */}
      <button
        onClick={() => setBookingOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground border-t border-border hover:bg-foreground/5 transition-colors"
      >
        Bu sanatçıyla planla
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {/* Quick view + booking wizard */}
      <AnimatePresence>
        {quickOpen && (
          <ArtistQuickView
            dj={dj}
            onClose={() => setQuickOpen(false)}
            onBooking={() => { setQuickOpen(false); setBookingOpen(true); }}
          />
        )}
        {bookingOpen && (
          <ArtistBookingWizard
            artistId={dj.id}
            artistName={dj.name}
            onClose={() => setBookingOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
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
