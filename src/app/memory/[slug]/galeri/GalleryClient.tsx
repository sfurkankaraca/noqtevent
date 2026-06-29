"use client";

import { useState } from "react";
import Link from "next/link";

type Upload = {
  id: string;
  file_url: string;
  file_type: string;
  file_name?: string | null;
  uploader_name?: string | null;
  created_at: string;
};

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
      <div className="px-6 pt-12 pb-8 flex items-center justify-between max-w-5xl mx-auto">
        <div>
          <p className="text-white/30 text-[10px] tracking-[0.35em] uppercase mb-1">Galeri</p>
          <h1 className="text-2xl font-light" style={{ fontFamily: "Georgia, serif" }}>{event.title}</h1>
          <p className="text-white/30 text-xs mt-1">{uploads.length} içerik · {images.length} fotoğraf · {videos.length} video</p>
        </div>
        <Link
          href={`/memory/${event.slug}`}
          className="text-xs border border-white/20 px-4 py-2 rounded-full text-white/50 hover:border-white/40 hover:text-white/70 transition-all"
        >
          + Yükle
        </Link>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.file_url}
                    alt={u.file_name ?? ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
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
              {videos.map((u) => (
                <div key={u.id} className="rounded-xl overflow-hidden bg-white/5">
                  <video
                    src={u.file_url}
                    controls
                    className="w-full"
                    preload="metadata"
                  />
                  {u.uploader_name && (
                    <p className="text-white/40 text-xs px-3 py-2">{u.uploader_name}</p>
                  )}
                </div>
              ))}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.file_url}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.uploader_name && (
            <p className="absolute bottom-6 text-white/40 text-xs">{lightbox.uploader_name}</p>
          )}
        </div>
      )}
    </div>
  );
}
