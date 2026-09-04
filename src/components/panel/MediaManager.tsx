"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAllowedVideoUrl, extractMuxPlaybackId } from "@/lib/panel/media";

type PhotoEntry = { url: string; uploading?: boolean; error?: string };

type VideoAssetStatus = "uploading" | "processing" | "ready" | "errored" | "rejected_duration";
type VideoAsset = {
  uploadId: string;
  assetId: string | null;
  playbackId: string | null;
  status: VideoAssetStatus;
  durationSeconds: number | null;
};

const VIDEO_ASSET_STATUS_LABEL: Record<VideoAssetStatus, string> = {
  uploading: "Yükleniyor…",
  processing: "İşleniyor…",
  ready: "Hazır",
  errored: "Hata — video işlenemedi",
  rejected_duration: "Reddedildi — 60 saniyeyi aşıyor",
};

async function initMuxUpload(entityId: string, kind: "venue" | "artist"): Promise<{ uploadUrl: string; uploadId: string }> {
  const res = await fetch("/api/panel/media/mux-upload-init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityId, kind }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? "Video yükleme başlatılamadı.");
  }
  return res.json();
}

async function uploadPhoto(file: File, entityId: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("entityId", entityId);
  const res = await fetch("/api/panel/media/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? "Yükleme başarısız.");
  }
  const { url } = await res.json();
  return url as string;
}

// Mekan/sanatçı medya yönetimi — panel admin formunda VE (ileride) sahiplenen
// mekan/sanatçının kendi panelinde aynen kullanılabilecek şekilde tasarlandı
// (kurucu talebi: admin formu, sahiplenenin düzenleyebileceği her şeyin üst
// kümesi olmalı). "venue" için galerinin ilk elemanı kapak kabul edilir
// (photo_urls[0]); "artist" için kapak (photo_url) galeriden AYRI, tek bir
// alan — galeri elemanları üzerindeki "Kapak yap" yıldızı bu alanı günceller.
//
// Bu bileşen, çevresindeki native <form action={serverAction}> içine hidden
// input'lar render eder (name=coverFieldName/galleryFieldName/videoFieldName);
// React state → DOM value senkron olduğundan, formun submit anındaki FormData
// okuması bu değerleri normal bir input gibi görür — ayrı bir client submit
// handler'ı GEREKMEZ.
export default function MediaManager({
  entityId,
  kind,
  initialCoverUrl = "",
  initialGalleryUrls,
  initialVideoUrls,
  initialVideoAssets = [],
  coverFieldName = "photoUrl",
  galleryFieldName = "photoUrls",
  videoFieldName = "videoUrls",
}: {
  entityId: string;
  kind: "venue" | "artist";
  initialCoverUrl?: string;
  initialGalleryUrls: string[];
  initialVideoUrls: string[];
  /// Henüz `video_urls`e girmemiş (yükleniyor/işleniyor/reddedildi) native
  /// video durumları — yalnız BİLGİLENDİRME amaçlı, sayfa yeniden
  /// yüklenince güncellenir (canlı polling YOK, kapsam dışı bırakıldı).
  initialVideoAssets?: VideoAsset[];
  coverFieldName?: string;
  galleryFieldName?: string;
  videoFieldName?: string;
}) {
  const [cover, setCover] = useState(initialCoverUrl);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<PhotoEntry[]>(initialGalleryUrls.map((url) => ({ url })));
  const [videos, setVideos] = useState<string[]>(initialVideoUrls);
  const [videoInput, setVideoInput] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [nativeUploading, setNativeUploading] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);
  // Bu oturumda başlatılan yüklemeler — sayfa yeniden yüklenmeden de
  // kullanıcıya "yükleniyor" geri bildirimi versin diye ayrı tutulur;
  // initialVideoAssets (sunucudan gelen, bir önceki sayfa yüklemesindeki
  // durum) ile BİRLİKTE gösterilir.
  const [pendingNativeUploads, setPendingNativeUploads] = useState<VideoAsset[]>([]);
  const nativeVideoInputRef = useRef<HTMLInputElement>(null);

  const handleNativeVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (nativeVideoInputRef.current) nativeVideoInputRef.current.value = "";
    setNativeUploading(true);
    setNativeError(null);
    try {
      const { uploadUrl, uploadId } = await initMuxUpload(entityId, kind);
      const putRes = await fetch(uploadUrl, { method: "PUT", body: file });
      if (!putRes.ok) throw new Error("Video yüklenemedi (bağlantı kesildi olabilir).");
      setPendingNativeUploads((prev) => [
        ...prev,
        { uploadId, assetId: null, playbackId: null, status: "uploading", durationSeconds: null },
      ]);
    } catch (err) {
      setNativeError(err instanceof Error ? err.message : "Video yükleme hatası.");
    } finally {
      setNativeUploading(false);
    }
  };

  const nativeStatusList = [...initialVideoAssets, ...pendingNativeUploads].filter(
    (a) => a.status !== "ready", // hazır olanlar zaten alttaki Videolar listesinde (video_urls üzerinden) görünüyor
  );

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const readyGalleryUrls = gallery.filter((p) => p.url && !p.uploading && !p.error).map((p) => p.url);
  const isUploading = coverUploading || gallery.some((p) => p.uploading);

  const handleGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (galleryInputRef.current) galleryInputRef.current.value = "";

    const startIdx = gallery.length;
    setGallery((prev) => [...prev, ...files.map(() => ({ url: "", uploading: true }))]);

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadPhoto(files[i], entityId);
        setGallery((prev) => {
          const next = [...prev];
          next[startIdx + i] = { url };
          return next;
        });
      } catch (err) {
        setGallery((prev) => {
          const next = [...prev];
          next[startIdx + i] = { url: "", error: err instanceof Error ? err.message : "Hata" };
          return next;
        });
      }
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverInputRef.current) coverInputRef.current.value = "";
    setCoverUploading(true);
    setCoverError(null);
    try {
      const url = await uploadPhoto(file, entityId);
      setCover(url);
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "Yükleme hatası");
    } finally {
      setCoverUploading(false);
    }
  };

  const removeGalleryEntry = (idx: number) => setGallery((prev) => prev.filter((_, i) => i !== idx));

  const moveGalleryEntry = (idx: number, dir: -1 | 1) =>
    setGallery((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const moveToFront = (idx: number) =>
    setGallery((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });

  const makeCover = (idx: number) => {
    const entry = gallery[idx];
    if (!entry?.url) return;
    if (kind === "venue") {
      moveToFront(idx);
    } else {
      setCover(entry.url);
    }
  };

  const addVideo = () => {
    const url = videoInput.trim();
    if (!url) return;
    if (!isAllowedVideoUrl(url)) {
      setVideoError("Yalnız YouTube veya Vimeo linki eklenebilir.");
      return;
    }
    if (videos.includes(url)) {
      setVideoError("Bu link zaten eklendi.");
      return;
    }
    setVideos((prev) => [...prev, url]);
    setVideoInput("");
    setVideoError(null);
  };

  const removeVideo = (url: string) => setVideos((prev) => prev.filter((v) => v !== url));

  return (
    <div className="space-y-5">
      {/* Kapak — yalnız sanatçı: mekanın kapağı galerinin ilk fotoğrafıdır */}
      {kind === "artist" && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Kapak fotoğrafı</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Listelerde ve profil kartında görünen ana fotoğraf. Galeriden bir fotoğrafı da &quot;Kapak yap&quot; ile
              seçebilirsiniz.
            </p>
          </div>
          <input type="hidden" name={coverFieldName} value={cover} readOnly />
          <div className="flex items-center gap-3">
            {cover ? (
              <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/30">
                <Image src={cover} alt="" fill sizes="80px" className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-24 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">
                Kapak yok
              </div>
            )}
            <div className="space-y-1.5">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-foreground/40 transition-colors ${
                  coverUploading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {coverUploading ? "Yükleniyor…" : cover ? "Değiştir" : "Yükle"}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={coverUploading}
                  onChange={handleCoverFile}
                />
              </label>
              {cover && (
                <button
                  type="button"
                  onClick={() => setCover("")}
                  className="block text-xs text-red-500 hover:text-red-700"
                >
                  Kapağı kaldır
                </button>
              )}
              {coverError && <p className="text-xs text-red-600">{coverError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Galeri */}
      <div className="space-y-3 rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium">Fotoğraflar</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {kind === "venue"
              ? "İlk fotoğraf kapak olarak kullanılır. Sıralamayı ok tuşlarıyla değiştirin."
              : "Profil galerisinde gösterilir (kapak ayrı)."}{" "}
            JPEG/PNG/WEBP, en fazla 8 MB.
          </p>
        </div>

        <input type="hidden" name={galleryFieldName} value={readyGalleryUrls.join("\n")} readOnly />

        {gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((entry, i) => {
              if (entry.uploading) {
                return (
                  <div
                    key={`uploading-${i}`}
                    className="flex aspect-[3/4] items-center justify-center rounded-lg border border-border bg-secondary/20 text-xs text-muted-foreground animate-pulse"
                  >
                    Yükleniyor…
                  </div>
                );
              }
              if (entry.error) {
                return (
                  <div
                    key={`error-${i}`}
                    className="flex flex-col items-center justify-center gap-2 aspect-[3/4] rounded-lg border border-red-200 bg-red-50 p-2 text-center"
                  >
                    <span className="text-[11px] text-red-600">{entry.error}</span>
                    <button
                      type="button"
                      onClick={() => removeGalleryEntry(i)}
                      className="text-[11px] text-red-500 hover:text-red-700"
                    >
                      Kaldır
                    </button>
                  </div>
                );
              }
              const isCover = kind === "venue" ? i === 0 : entry.url === cover;
              return (
                <div key={entry.url} className="space-y-1.5">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-secondary/30">
                    <Image src={entry.url} alt="" fill sizes="200px" className="object-cover" unoptimized />
                    {isCover && (
                      <span className="absolute left-1 top-1 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] text-background">
                        ⭐ Kapak
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveGalleryEntry(i, -1)}
                        title="Yukarı taşı"
                        className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={i === gallery.length - 1}
                        onClick={() => moveGalleryEntry(i, 1)}
                        title="Aşağı taşı"
                        className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {!isCover && (
                        <button
                          type="button"
                          onClick={() => makeCover(i)}
                          title="Kapak yap"
                          className="rounded p-1 text-muted-foreground hover:text-foreground"
                        >
                          ⭐
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGalleryEntry(i)}
                      className="text-[11px] text-red-500 hover:text-red-700"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <label
          className={`flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-lg px-4 py-3 hover:border-foreground/40 transition-colors ${
            isUploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <span className="text-sm text-muted-foreground">{isUploading ? "Yükleniyor…" : "+ Fotoğraf ekle"}</span>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={isUploading}
            onChange={handleGalleryFiles}
          />
        </label>
        {isUploading && (
          <p className="text-[11px] text-amber-600">
            Yükleme bitmeden kaydederseniz henüz tamamlanmayan dosyalar kaydedilmez — lütfen bekleyin.
          </p>
        )}
      </div>

      {/* Videolar */}
      <div className="space-y-3 rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium">Videolar</p>
          <p className="text-xs text-muted-foreground mt-0.5">YouTube veya Vimeo video linki ekleyin.</p>
        </div>

        <input type="hidden" name={videoFieldName} value={videos.join("\n")} readOnly />

        {videos.length > 0 && (
          <ul className="space-y-1.5">
            {videos.map((url) => {
              const muxId = extractMuxPlaybackId(url);
              return (
                <li
                  key={url}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-1.5"
                >
                  {muxId ? (
                    <span className="truncate text-xs text-foreground">🎬 Yüklenen video ({muxId.slice(0, 8)}…)</span>
                  ) : (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-foreground hover:underline">
                      {url}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeVideo(url)}
                    className="flex-shrink-0 text-xs text-red-500 hover:text-red-700"
                  >
                    Kaldır
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {videoError && <p className="text-xs text-red-600">{videoError}</p>}

        <div className="flex gap-2">
          <Input
            value={videoInput}
            onChange={(e) => {
              setVideoInput(e.target.value);
              setVideoError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addVideo();
              }
            }}
            placeholder="https://youtube.com/… veya https://vimeo.com/…"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addVideo}>
            Ekle
          </Button>
        </div>
      </div>

      {/* Native video (Mux) — YouTube/Vimeo linki olmadan uygulama içinde
          akıcı (HLS) oynatılan video. Hazır olan videolar bir işleme
          gecikmesinin ardından yukarıdaki Videolar listesinde görünür
          (bkz. mux-webhook route) — bu bölüm yalnız YÜKLEME ve ARA
          DURUMLARI (yükleniyor/işleniyor/reddedildi) için. */}
      <div className="space-y-3 rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium">Video yükle</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bilgisayarından doğrudan video yükle — YouTube/Vimeo hesabı gerekmez. En fazla 60 saniye;
            uzun videolar otomatik reddedilir. Video sayısında sınır yok.
          </p>
        </div>

        {nativeStatusList.length > 0 && (
          <ul className="space-y-1.5">
            {nativeStatusList.map((a) => (
              <li
                key={a.uploadId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-1.5"
              >
                <span className="truncate text-xs text-muted-foreground">{VIDEO_ASSET_STATUS_LABEL[a.status]}</span>
                {a.status === "rejected_duration" && a.durationSeconds && (
                  <span className="text-[11px] text-red-600">{Math.round(a.durationSeconds)}sn</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {nativeError && <p className="text-xs text-red-600">{nativeError}</p>}

        <label
          className={`flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-lg px-4 py-3 hover:border-foreground/40 transition-colors ${
            nativeUploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <span className="text-sm text-muted-foreground">{nativeUploading ? "Yükleniyor…" : "+ Video yükle"}</span>
          <input
            ref={nativeVideoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
            className="sr-only"
            disabled={nativeUploading}
            onChange={handleNativeVideoFile}
          />
        </label>
      </div>
    </div>
  );
}
