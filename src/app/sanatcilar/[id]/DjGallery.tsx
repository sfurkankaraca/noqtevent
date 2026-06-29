"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

type Props = {
  photos: string[];
  focalPoints: Record<string, { x: number; y: number }>;
  name: string;
  uploadedVideos: string[];
};

export default function DjGallery({ photos, focalPoints, name, uploadedVideos }: Props) {
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const coverPhoto = photos[0] ?? null;
  const galleryPhotos = photos.slice(1);
  const coverFp = coverPhoto ? (focalPoints[coverPhoto] ?? { x: 50, y: 50 }) : { x: 50, y: 50 };

  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((l) => l && l.index < l.photos.length - 1 ? { ...l, index: l.index + 1 } : l);
      if (e.key === "ArrowLeft") setLightbox((l) => l && l.index > 0 ? { ...l, index: l.index - 1 } : l);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <>
      {/* Videos */}
      {uploadedVideos.length > 0 && (
        <div className="mb-12 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Videolar</p>
          <div className={`grid gap-4 ${uploadedVideos.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
            {uploadedVideos.map((url, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-secondary aspect-video relative group">
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  src={url}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
                <button
                  className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => videoRefs.current[i]?.requestFullscreen?.()}
                  title="Tam ekran"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cover photo */}
      <div
        className="aspect-[3/4] rounded-2xl overflow-hidden bg-[oklch(0.92_0.02_320)] relative cursor-zoom-in"
        onClick={() => coverPhoto && setLightbox({ photos, index: 0 })}
      >
        {coverPhoto ? (
          <>
            <Image
              src={coverPhoto}
              alt={name}
              fill
              className="object-cover"
              style={{ objectPosition: `${coverFp.x}% ${coverFp.y}%` }}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-end justify-end p-3">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                Büyüt
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl font-light text-foreground/20" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>{initials}</span>
          </div>
        )}
      </div>

      {/* Gallery strip */}
      {galleryPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {galleryPhotos.map((url, i) => {
            const fp = focalPoints[url] ?? { x: 50, y: 50 };
            return (
              <button
                key={url}
                className="aspect-square rounded-xl overflow-hidden relative group/thumb cursor-zoom-in"
                onClick={() => setLightbox({ photos, index: i + 1 })}
              >
                <Image
                  src={url}
                  alt={`${name} ${i + 2}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                  style={{ objectPosition: `${fp.x}% ${fp.y}%` }}
                  sizes="33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors" />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightbox.index + 1} / {lightbox.photos.length}
          </div>

          {/* Prev */}
          {lightbox.index > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox((l) => l ? { ...l, index: l.index - 1 } : l); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}

          {/* Next */}
          {lightbox.index < lightbox.photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox((l) => l ? { ...l, index: l.index + 1 } : l); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          )}

          {/* Image */}
          <div className="relative w-full h-full max-w-4xl max-h-[90vh] mx-16" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox.photos[lightbox.index]}
              alt={name}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Thumbnails strip */}
          {lightbox.photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {lightbox.photos.map((url, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightbox((l) => l ? { ...l, index: i } : l); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden relative transition-all ${i === lightbox.index ? "ring-2 ring-white" : "opacity-50 hover:opacity-80"}`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
