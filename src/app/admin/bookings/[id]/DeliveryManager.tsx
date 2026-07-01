"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { saveDelivery, sendDelivery } from "../actions";

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Yükleme başarısız");
  }
  const { url } = await res.json();
  return url;
}

async function uploadFileDirect(file: File, folder: string, onProgress?: (pct: number) => void): Promise<string> {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, filename: file.name, contentType: file.type }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "URL alınamadı");
  }
  const { signedUrl, publicUrl } = await res.json();
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`Yükleme hatası: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Ağ hatası"));
    xhr.send(file);
  });
  return publicUrl;
}

type Props = {
  bookingId: string;
  clientName: string;
  clientEmail: string | null;
  initialSlug: string | null;
  initialPhotos: string[];
  initialVideos: string[];
  initialNotes: string | null;
  sentAt: string | null;
};

export default function DeliveryManager({
  bookingId, clientName, clientEmail, initialSlug, initialPhotos, initialVideos, initialNotes, sentAt,
}: Props) {
  const toSlug = (s: string) =>
    s.toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const [slug, setSlug] = useState(initialSlug ?? "");
  const [photos, setPhotos] = useState<{ url: string; uploading?: boolean; error?: string }[]>(
    initialPhotos.map((url) => ({ url }))
  );
  const [videos, setVideos] = useState<{ url: string; uploading?: boolean; progress?: number; error?: string }[]>(
    initialVideos.map((url) => ({ url }))
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasSent, setWasSent] = useState(!!sentAt);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.noqt.events";
  const deliveryUrl = slug ? `${origin}/teslimat/${slug}` : null;

  const handlePhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    const placeholders = files.map(() => ({ url: "", uploading: true }));
    setPhotos((p) => [...p, ...placeholders]);
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile(files[i], "bookings/delivery");
        setPhotos((prev) => {
          const next = [...prev];
          const idx = next.findIndex((p) => p.uploading && p.url === "");
          if (idx !== -1) next[idx] = { url };
          return next;
        });
      } catch (err) {
        setPhotos((prev) => {
          const next = [...prev];
          const idx = next.findIndex((p) => p.uploading && p.url === "");
          if (idx !== -1) next[idx] = { url: "", error: err instanceof Error ? err.message : "Hata" };
          return next;
        });
      }
    }
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const idx = videos.length;
    setVideos((p) => [...p, { url: "", uploading: true, progress: 0 }]);
    try {
      const url = await uploadFileDirect(file, "bookings/delivery", (pct) => {
        setVideos((p) => p.map((v, i) => (i === idx ? { ...v, progress: pct } : v)));
      });
      setVideos((p) => p.map((v, i) => (i === idx ? { url } : v)));
    } catch (err) {
      setVideos((p) => p.map((v, i) => (i === idx ? { url: "", error: err instanceof Error ? err.message : "Hata" } : v)));
    }
  };

  const handleSave = () => {
    setError(null);
    const readyPhotos = photos.filter((p) => p.url && !p.uploading && !p.error).map((p) => p.url);
    const readyVideos = videos.filter((v) => v.url && !v.uploading && !v.error).map((v) => v.url);
    startTransition(async () => {
      try {
        await saveDelivery(bookingId, { slug: slug || toSlug(clientName + "-" + bookingId.slice(0, 6)), photos: readyPhotos, videos: readyVideos, notes });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kayıt başarısız");
      }
    });
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await sendDelivery(bookingId);
      setWasSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Etkinlik Sonrası Teslimat</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Fotoğraf/video yükle, müşteriye özel bir teslim raporu linki oluştur ve e-posta ile gönder.
        </p>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      {/* Slug */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">/teslimat/</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="musteri-adi"
            className={`${inputCls} pl-[74px] font-mono`} />
        </div>
        <button type="button" onClick={() => setSlug(toSlug(clientName + "-" + bookingId.slice(0, 6)))}
          className="text-xs px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0">
          Üret
        </button>
      </div>

      {/* Fotoğraflar */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Fotoğraflar ({photos.filter((p) => p.url).length})</p>
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((ph, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary/20">
                {ph.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  </div>
                ) : ph.error ? (
                  <button onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                    className="w-full h-full flex items-center justify-center text-[9px] text-red-500 p-1">Hata, kaldır</button>
                ) : (
                  <>
                    <Image src={ph.url} alt="" fill className="object-cover" unoptimized />
                    <button onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-xl px-3 py-2 hover:border-foreground/40 transition-colors">
          <span className="text-sm">📷</span>
          <span className="text-xs text-muted-foreground">Fotoğraf Yükle</span>
          <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoFiles} />
        </label>
      </div>

      {/* Videolar */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Videolar ({videos.filter((v) => v.url).length})</p>
        {videos.map((v, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {v.uploading ? (
              <span className="text-muted-foreground">Yükleniyor… %{v.progress ?? 0}</span>
            ) : v.error ? (
              <span className="text-red-500">{v.error}</span>
            ) : (
              <span className="text-foreground truncate flex-1">{decodeURIComponent(v.url.split("/").pop() ?? "video")}</span>
            )}
            <button onClick={() => setVideos((p) => p.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-500">×</button>
          </div>
        ))}
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-xl px-3 py-2 hover:border-foreground/40 transition-colors">
          <span className="text-sm">🎬</span>
          <span className="text-xs text-muted-foreground">Video Yükle</span>
          <input type="file" accept="video/*" className="sr-only" onChange={handleVideoFile} />
        </label>
      </div>

      {/* Not */}
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        placeholder="Müşteriye görünecek not (opsiyonel)…" className={`${inputCls} resize-none text-xs`} />

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={isPending}
          className="flex-1 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
          {isPending ? "Kaydediliyor…" : saved ? "✓ Kaydedildi" : "Kaydet"}
        </button>
        {deliveryUrl && (
          <a href={deliveryUrl} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            Aç ↗
          </a>
        )}
      </div>

      {slug && (
        <button onClick={handleSend} disabled={sending || !clientEmail}
          className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {sending ? "Gönderiliyor…" : wasSent ? "✓ Tekrar Gönder" : "Müşteriye E-posta Gönder"}
        </button>
      )}
      {!clientEmail && <p className="text-xs text-muted-foreground">Müşteri e-postası yok, otomatik gönderim yapılamaz.</p>}
    </div>
  );
}
