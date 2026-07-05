"use client";

import { useState } from "react";
import Link from "next/link";

type Upload = {
  id: string;
  file_url: string;
  display_url?: string; // proxy URL — img/video görüntülemesi için (indirmeler file_url)
  youtube_url?: string | null; // video YouTube'a taşındıysa gömülü oynatıcı
  file_type: string;
  file_name?: string | null;
  uploader_name?: string | null;
  created_at: string;
};

// YouTube watch/short URL'inden gömülü (embed) URL üretir
function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function downloadUrl(url: string, name: string) {
  return `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
}

// Çoğu masaüstü tarayıcı (Chrome, Firefox) HEIC/HEIF'i <img> içinde render edemez —
// bu dosyalar için kırık görsel yerine "önizleme yok" ikonu gösteriyoruz
function isHeicUpload(u: Upload): boolean {
  const ext = (u.file_name ?? u.file_url).split(".").pop()?.toLowerCase() ?? "";
  return ext === "heic" || ext === "heif";
}

function PhotoFallbackIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

// <img> her zaman render edilir; kaynak render edilemezse (HEIC ya da hata)
// görsel gizlenip yanındaki ikon fallback'i gösterilir
function GalleryImage({ src, alt, className, forceIconOnly }: { src: string; alt: string; className: string; forceIconOnly: boolean }) {
  return (
    <>
      {!forceIconOnly && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={className}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
      )}
      <div className={`w-full h-full flex-col items-center justify-center gap-1 text-white/30 ${forceIconOnly ? "flex" : "hidden absolute inset-0"}`}>
        <PhotoFallbackIcon />
        <span className="text-[10px]">Önizleme yok</span>
      </div>
    </>
  );
}

export default function GalleryClient({
  event,
  uploads,
}: {
  event: { slug: string; title: string };
  uploads: Upload[];
}) {
  const [lightbox, setLightbox] = useState<Upload | null>(null);

  const images = uploads.filter((u) => u.file_type === "image");
  const videos = uploads.filter((u) => u.file_type === "video");

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 flex items-center justify-between max-w-5xl mx-auto gap-4">
        <div className="min-w-0">
          <p className="text-white/30 text-[10px] tracking-[0.35em] uppercase mb-1">Galeri</p>
          <h1 className="text-2xl font-light truncate" style={{ fontFamily: "Georgia, serif" }}>{event.title}</h1>
          <p className="text-white/30 text-xs mt-1">{uploads.length} içerik · {images.length} fotoğraf · {videos.length} video</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {images.length > 0 && (
            <a
              href={`/api/memory/download-all?slug=${encodeURIComponent(event.slug)}`}
              className="text-xs border border-white/20 px-4 py-2 rounded-full text-white/50 hover:border-white/40 hover:text-white/70 transition-all whitespace-nowrap"
            >
              ⬇ Tüm Fotoğraflar (.zip)
            </a>
          )}
          <Link
            href={`/memory/${event.slug}`}
            className="text-xs border border-white/20 px-4 py-2 rounded-full text-white/50 hover:border-white/40 hover:text-white/70 transition-all whitespace-nowrap"
          >
            + Yükle
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {uploads.length === 0 && (
          <div className="text-center py-24 text-white/20 text-sm">
            Henüz içerik yüklenmedi.
          </div>
        )}

        {/* Fotoğraflar */}
        {images.length > 0 && (
          <div>
            {videos.length > 0 && (
              <p className="text-white/20 text-[10px] tracking-[0.25em] uppercase mb-4 px-2">Fotoğraflar ({images.length})</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
              {images.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setLightbox(u)}
                  className="relative aspect-square overflow-hidden rounded-lg bg-white/5 group"
                >
                  <GalleryImage
                    src={u.display_url ?? u.file_url}
                    alt={u.file_name ?? ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    forceIconOnly={isHeicUpload(u)}
                  />
                  {u.uploader_name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs">{u.uploader_name}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Videolar */}
        {videos.length > 0 && (
          <div className="mt-8">
            <p className="text-white/20 text-[10px] tracking-[0.25em] uppercase mb-4 px-2">Videolar ({videos.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map((u) => {
                const embed = u.youtube_url ? youtubeEmbed(u.youtube_url) : null;
                return (
                  <div key={u.id} className="rounded-xl overflow-hidden bg-white/5">
                    {embed ? (
                      <div className="relative w-full aspect-video">
                        <iframe
                          src={embed}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={u.file_name ?? "video"}
                        />
                      </div>
                    ) : (
                      <video
                        src={u.display_url ?? u.file_url}
                        controls
                        className="w-full"
                        preload="metadata"
                      />
                    )}
                    <div className="flex items-center justify-between px-3 py-2">
                      {u.uploader_name ? (
                        <p className="text-white/40 text-xs">{u.uploader_name}</p>
                      ) : <span />}
                      {!embed && (
                        <a
                          href={downloadUrl(u.file_url, u.file_name ?? "video.mp4")}
                          className="text-white/40 hover:text-white/70 text-xs transition-colors"
                        >
                          ⬇ İndir
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
          {isHeicUpload(lightbox) ? (
            <div className="flex flex-col items-center gap-3 text-white/40" onClick={(e) => e.stopPropagation()}>
              <PhotoFallbackIcon className="w-16 h-16" />
              <p className="text-sm">Bu dosya (HEIC) tarayıcıda önizlenemiyor — indirerek görüntüleyebilirsiniz.</p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.display_url ?? lightbox.file_url}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          <div className="absolute bottom-6 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
            {lightbox.uploader_name && (
              <p className="text-white/40 text-xs">{lightbox.uploader_name}</p>
            )}
            <a
              href={downloadUrl(lightbox.file_url, lightbox.file_name ?? "foto.jpg")}
              className="text-white/50 hover:text-white text-xs border border-white/20 px-3 py-1.5 rounded-full transition-colors"
            >
              ⬇ İndir
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
