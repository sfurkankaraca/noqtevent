"use client";

import { useState, useTransition } from "react";
import { deleteUpload } from "../actions";

type Upload = {
  id: string;
  file_url: string;
  file_path: string;
  file_type: string;
  file_name?: string | null;
  file_size?: number | null;
  uploader_name?: string | null;
  created_at: string;
};

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminGallery({ uploads }: { uploads: Upload[] }) {
  const [items, setItems] = useState(uploads);
  const [lightbox, setLightbox] = useState<Upload | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(upload: Upload) {
    if (!confirm("Bu dosyayı sil?")) return;
    startTransition(async () => {
      await deleteUpload(upload.id, upload.file_path);
      setItems((prev) => prev.filter((u) => u.id !== upload.id));
    });
  }

  const images = items.filter((u) => u.file_type === "image");
  const videos = items.filter((u) => u.file_type === "video");

  return (
    <div className="space-y-6">
      {/* Fotoğraflar */}
      {images.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">
            Fotoğraflar ({images.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {images.map((u) => (
              <div key={u.id} className="relative aspect-square rounded-xl overflow-hidden bg-secondary group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u.file_url}
                  alt={u.file_name ?? ""}
                  className="w-full h-full object-cover cursor-pointer"
                  loading="lazy"
                  onClick={() => setLightbox(u)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <a
                    href={u.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/40 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(u); }}
                    disabled={pending}
                    className="w-8 h-8 rounded-full bg-red-500/60 backdrop-blur flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                {u.uploader_name && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] truncate">{u.uploader_name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videolar */}
      {videos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">
            Videolar ({videos.length})
          </p>
          <div className="space-y-3">
            {videos.map((u) => (
              <div key={u.id} className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
                <video src={u.file_url} className="w-32 h-20 object-cover rounded-lg bg-secondary" preload="metadata" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.file_name ?? "video"}</p>
                  {u.uploader_name && <p className="text-xs text-muted-foreground mt-0.5">{u.uploader_name}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatSize(u.file_size)} · {new Date(u.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={u.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors"
                  >
                    İndir
                  </a>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={pending}
                    className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl w-10 h-10 flex items-center justify-center">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.file_url} alt="" className="max-w-full max-h-[90vh] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 flex items-center gap-3">
            {lightbox.uploader_name && <p className="text-white/40 text-xs">{lightbox.uploader_name}</p>}
            <a href={lightbox.file_url} download target="_blank" rel="noopener noreferrer"
              className="text-xs border border-white/20 px-4 py-2 rounded-full text-white/60 hover:border-white/40 transition-colors">
              İndir
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
