"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

type UploadedFile = { url: string; type: "image" | "video"; name: string; isHeic: boolean };

// Bazı tarayıcılar (özellikle HEIC/MOV için) file.type'ı boş bırakır — uzantıdan tamamla
const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  heic: "image/heic", heif: "image/heif",
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
};

function mimeFor(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? "";
}

// Çoğu masaüstü tarayıcı (Chrome, Firefox) HEIC/HEIF'i <img> içinde render edemez —
// bu dosyalar için önizleme yerine ikon gösteriyoruz ki kırık görsel simgesi çıkmasın
function isHeicFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ext === "heic" || ext === "heif" || mimeFor(file).includes("heic") || mimeFor(file).includes("heif");
}

export default function MemoryUploadClient({
  event,
}: {
  event: { id: string; slug: string; title: string; description?: string | null };
}) {
  const [name, setName] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [percent, setPercent] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dosyalar tarayıcıdan doğrudan R2'ye yüklenir (presigned URL) —
  // sunucu üzerinden geçirmek Vercel'in ~4.5MB body limitine takılıyordu.
  async function uploadFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    if (!arr.length) return;
    setTotal(arr.length);
    setProgress(0);
    setPercent(0);
    setErrors([]);
    setUploading(true);

    const totalBytes = arr.reduce((sum, f) => sum + f.size, 0);
    let doneBytes = 0;
    const results: UploadedFile[] = [];
    const failed: string[] = [];

    for (const file of arr) {
      try {
        const contentType = mimeFor(file);
        const presignRes = await fetch("/api/memory/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_slug: event.slug,
            filename: file.name,
            contentType,
            size: file.size,
          }),
        });
        const presign = await presignRes.json();
        if (!presignRes.ok || !presign.signedUrl) {
          throw new Error(presign.error || "Yükleme başlatılamadı");
        }

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presign.signedUrl);
          xhr.setRequestHeader("Content-Type", contentType);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && totalBytes > 0) {
              setPercent(Math.min(100, Math.round(((doneBytes + e.loaded) / totalBytes) * 100)));
            }
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`Yükleme hatası (${xhr.status})`));
          xhr.onerror = () => reject(new Error("Bağlantı hatası — tekrar deneyin"));
          xhr.send(file);
        });

        const confirmRes = await fetch("/api/memory/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_slug: event.slug,
            path: presign.path,
            file_name: file.name,
            file_size: file.size,
            file_type: presign.type,
            uploader_name: name.trim() || undefined,
          }),
        });
        if (!confirmRes.ok) {
          const j = await confirmRes.json().catch(() => ({}));
          throw new Error(j.error || "Kayıt oluşturulamadı");
        }

        results.push({ url: presign.publicUrl, type: presign.type, name: file.name, isHeic: isHeicFile(file) });
      } catch (err) {
        failed.push(`${file.name}: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
      }
      doneBytes += file.size;
      setPercent(totalBytes > 0 ? Math.min(100, Math.round((doneBytes / totalBytes) * 100)) : 0);
      setProgress((p) => p + 1);
    }

    setFiles((f) => [...f, ...results]);
    setErrors(failed);
    setUploading(false);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 text-center">
        <p className="text-white/30 text-[10px] tracking-[0.35em] uppercase mb-4">Memory Drive</p>
        <h1 className="text-3xl font-light" style={{ fontFamily: "Georgia, serif" }}>
          {event.title}
        </h1>
        {event.description && (
          <p className="text-white/50 text-sm mt-3 max-w-xs mx-auto leading-relaxed">{event.description}</p>
        )}
      </div>

      <div className="max-w-lg mx-auto px-6 pb-20 space-y-6">
        {/* Name input */}
        <div>
          <label className="block text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2">Adınız (isteğe bağlı)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adınızı girin"
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/35 transition-colors"
          />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragging ? "border-white/50 bg-white/8" : "border-white/15 hover:border-white/30 hover:bg-white/5"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />

          {uploading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
              <p className="text-white/60 text-sm">{progress} / {total} dosya · %{percent}</p>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-white/8 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="text-white/70 text-base font-light">Fotoğraf ve video seç</p>
              <p className="text-white/30 text-xs mt-2">Veya sürükleyip bırakın · Birden fazla dosya seçilebilir</p>
              <p className="text-white/20 text-xs mt-1">JPG, PNG, HEIC, MP4, MOV · Maks 20MB / 500MB video</p>
            </>
          )}
        </div>

        {/* Yüklenemeyenler */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 space-y-1">
            <p className="text-red-300 text-xs font-medium">Yüklenemeyen dosyalar — lütfen tekrar deneyin:</p>
            {errors.map((e, i) => (
              <p key={i} className="text-red-200/70 text-xs break-all">{e}</p>
            ))}
          </div>
        )}

        {/* Yüklenenler */}
        {files.length > 0 && (
          <div>
            <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase mb-3">
              Yüklenen ({files.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white/8">
                  {f.type === "image" && !f.isHeic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.url}
                      alt={f.name}
                      className="w-full h-full object-cover"
                      // Tarayıcı görseli render edemezse (ör. beklenmeyen format) kırık ikon yerine
                      // yerine geçen ikonu göster
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex-col items-center justify-center gap-1 ${f.type === "image" && !f.isHeic ? "hidden" : "flex"}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                      {f.type === "video" ? (
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      ) : (
                        <>
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </>
                      )}
                    </svg>
                    {f.isHeic && <span className="text-white/40 text-[9px] px-1">Yüklendi ✓</span>}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Daha fazla yükle */}
            {!uploading && (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full mt-4 py-3 rounded-xl border border-white/15 text-sm text-white/50 hover:border-white/30 hover:text-white/70 transition-all"
              >
                + Daha fazla ekle
              </button>
            )}
          </div>
        )}

        {/* Galeri linki */}
        <div className="pt-4 border-t border-white/10 text-center">
          <Link
            href={`/memory/${event.slug}/galeri`}
            className="text-white/30 text-xs hover:text-white/50 transition-colors"
          >
            Galeriyi görüntüle →
          </Link>
        </div>
      </div>
    </div>
  );
}
