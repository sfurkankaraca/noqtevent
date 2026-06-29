"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { upsertDj } from "./actions";
import FocalPointPicker, { type FocalPoint } from "@/components/admin/FocalPointPicker";
import { MUSIC_CONCEPTS, CONCEPT_CATEGORIES, type ConceptCategory } from "@/components/planner/PlannerStore";

const CONCEPT_CATEGORY_ORDER: ConceptCategory[] = ["cocktail", "celebration", "traditional", "after-party"];

const PERFORMER_TYPES = [
  { id: "dj", label: "DJ", emoji: "🎧" },
  { id: "artist", label: "Solo Sanatçı", emoji: "🎤" },
  { id: "trio", label: "Trio / Grup", emoji: "🎶" },
  { id: "dance", label: "Dans Ekibi", emoji: "💃" },
  { id: "band", label: "Bando / Orkestra", emoji: "🎺" },
  { id: "host", label: "Sunucu / MC", emoji: "🎙️" },
  { id: "moderator", label: "Moderatör", emoji: "🗣️" },
];

const EVENT_TYPES = [
  { id: "wedding", label: "Düğün / Nikah", emoji: "💍" },
  { id: "kina", label: "Kına Gecesi", emoji: "🕯️" },
  { id: "graduation", label: "Mezuniyet", emoji: "🎓" },
  { id: "birthday", label: "Doğum Günü", emoji: "🎂" },
  { id: "bride", label: "Bekarlığa Veda", emoji: "👰" },
  { id: "morning-party", label: "Morning Party", emoji: "☕" },
  { id: "corporate", label: "Kurumsal Etkinlik", emoji: "🏢" },
  { id: "after-party", label: "After Party", emoji: "🌙" },
  { id: "cocktail", label: "Kokteyl / Resepsiyon", emoji: "🥂" },
  { id: "festival", label: "Festival / Açık Hava", emoji: "🎪" },
];

type Dj = {
  id?: string;
  name?: string;
  bio?: string;
  photo_url?: string;
  photos?: string[];
  focal_points?: Record<string, FocalPoint>;
  performer_type?: string;
  soundcloud_url?: string;
  mixcloud_url?: string;
  youtube_url?: string;
  youtube_links?: string[];
  instagram_url?: string;
  spotify_url?: string;
  website_url?: string;
  presskit_url?: string;
  city?: string;
  cover_cities?: string[];
  speciality?: string;
  repertoire?: string;
  event_types?: string[];
  email?: string;
  phone?: string;
  concept_tags?: string[];
  busy_dates?: string[];
  is_active?: boolean;
  application_status?: string;
  preview_video_url?: string;
  videos?: string[];
};

interface PhotoEntry {
  url: string;        // always a real https:// URL
  uploading?: boolean;
  error?: string;
}

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Upload başarısız");
  }
  const { url } = await res.json();
  return url;
}

// Büyük dosyalar (video) için Supabase'e direkt yükleme
async function uploadFileDirect(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  // 1. İmzalı URL al
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

  // 2. Direkt Supabase'e yükle (XMLHttpRequest ile progress takibi)
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

export default function DjForm({ dj }: { dj?: Dj }) {
  const router = useRouter();

  const initPhotos: PhotoEntry[] = (
    dj?.photos?.length ? dj.photos : dj?.photo_url ? [dj.photo_url] : []
  ).map((url) => ({ url }));

  const [photos, setPhotos] = useState<PhotoEntry[]>(initPhotos);
  const [focalPoints, setFocalPoints] = useState<Record<string, FocalPoint>>(
    dj?.focal_points ?? {}
  );
  const [conceptInput, setConceptInput] = useState("");
  const [concepts, setConcepts] = useState<string[]>(dj?.concept_tags ?? []);
  const [busyDates, setBusyDates] = useState<string[]>(dj?.busy_dates ?? []);
  const [busyDateInput, setBusyDateInput] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(dj?.event_types ?? []);
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>(
    dj?.youtube_links?.length ? dj.youtube_links : ["", "", ""]
  );
  const [videos, setVideos] = useState<{ url: string; uploading?: boolean; progress?: number; error?: string }[]>(
    (dj?.videos ?? (dj?.preview_video_url ? [dj.preview_video_url] : [])).map((url: string) => ({ url }))
  );
  const [videoUploading, setVideoUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleEventType = (id: string) =>
    setSelectedEventTypes((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );

  const isUploading = photos.some((p) => p.uploading);

  const addBusyDate = (date: string) => {
    if (date && !busyDates.includes(date)) setBusyDates((p) => [...p, date].sort());
    setBusyDateInput("");
  };
  const removeBusyDate = (date: string) => setBusyDates((p) => p.filter((d) => d !== date));
  const addConcept = (tag: string) => {
    const t = tag.trim();
    if (t && !concepts.includes(t)) setConcepts((p) => [...p, t]);
    setConceptInput("");
  };
  const removeConcept = (tag: string) => setConcepts((p) => p.filter((c) => c !== tag));

  const handlePhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Add placeholder entries with uploading state
    const placeholders: PhotoEntry[] = files.map(() => ({
      url: "",
      uploading: true,
    }));
    setPhotos((p) => [...p, ...placeholders]);

    // Upload each file individually
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile(files[i], "artists/photos");
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

  const removePhoto = (url: string) => {
    setPhotos((p) => p.filter((ph) => ph.url !== url));
    setFocalPoints((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  };

  const removeErrorPhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  };

  const setFocalPoint = (url: string, fp: FocalPoint) =>
    setFocalPoints((prev) => ({ ...prev, [url]: fp }));

  const getFocalPoint = (url: string): FocalPoint =>
    focalPoints[url] ?? { x: 50, y: 50 };

  const handleAction = async (fd: FormData) => {
    fd.set("concept_tags", concepts.join(","));
    fd.set("busy_dates", busyDates.join(","));
    fd.set("event_types_json", JSON.stringify(selectedEventTypes));
    fd.set("youtube_links_json", JSON.stringify(youtubeLinks.filter(Boolean)));

    const readyPhotos = photos.filter((p) => p.url && !p.uploading && !p.error);
    fd.set("photos_json", JSON.stringify(readyPhotos.map((p) => p.url)));

    const fpPayload: Record<string, FocalPoint> = {};
    readyPhotos.forEach((ph) => {
      fpPayload[ph.url] = getFocalPoint(ph.url);
    });
    fd.set("focal_points_json", JSON.stringify(fpPayload));
    const readyVideos = videos.filter((v) => v.url && !v.uploading && !v.error).map((v) => v.url);
    fd.set("videos_json", JSON.stringify(readyVideos));
    fd.set("preview_video_url", readyVideos[0] ?? "");

    setPending(true);
    setError(null);
    try {
      await upsertDj(fd);
      router.push("/admin/djler");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setPending(false);
    }
  };

  return (
    <form action={handleAction} className="space-y-6 max-w-2xl">
      {dj?.id && <input type="hidden" name="id" value={dj.id} />}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-medium text-foreground">Profil Bilgileri</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Tür</label>
            <select
              name="performer_type" defaultValue={dj?.performer_type ?? "dj"}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
            >
              {PERFORMER_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Uzmanlık / Stil</label>
            <input
              type="text" name="speciality" defaultValue={dj?.speciality ?? ""}
              placeholder="ör. Latin Dans, Caz, Deep House"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">İsim / Ekip Adı</label>
            <input
              type="text" name="name" defaultValue={dj?.name} required placeholder="Ad veya ekip adı"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Şehir</label>
            <input
              type="text" name="city" defaultValue={dj?.city ?? ""}
              placeholder="ör. İstanbul, İzmir"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Biyografi</label>
          <textarea
            name="bio" defaultValue={dj?.bio ?? ""} rows={4}
            placeholder="Sanatçı veya ekip hakkında kısa tanıtım…"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Repertuar</label>
          <textarea
            name="repertoire" defaultValue={dj?.repertoire ?? ""} rows={3}
            placeholder="Hangi dillerde / türlerde çalıyorlar? Türkçe pop, caz standartları, Arapça…"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">E-posta</label>
            <input
              type="email" name="email" defaultValue={dj?.email ?? ""}
              placeholder="iletisim@…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Telefon</label>
            <input
              type="tel" name="phone" defaultValue={dj?.phone ?? ""}
              placeholder="+90 5XX…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Aktif</label>
            <select
              name="is_active" defaultValue={dj?.is_active !== false ? "true" : "false"}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
            >
              <option value="true">Evet</option>
              <option value="false">Hayır</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Durum</label>
            <select
              name="application_status" defaultValue={dj?.application_status ?? "approved"}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
            >
              <option value="approved">Onaylandı</option>
              <option value="pending">Bekliyor</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div>
          <h2 className="font-medium text-foreground">Fotoğraflar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">İlk fotoğraf kapak olarak kullanılır. Yükleme seçince otomatik başlar.</p>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {photos.map((ph, i) => {
              if (ph.uploading) {
                return (
                  <div key={i} className="p-4 rounded-xl border border-border bg-secondary/20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary animate-pulse" />
                    <span className="text-xs text-muted-foreground">Yükleniyor…</span>
                  </div>
                );
              }
              if (ph.error) {
                return (
                  <div key={i} className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-center justify-between gap-3">
                    <span className="text-xs text-red-600">{ph.error}</span>
                    <button type="button" onClick={() => removeErrorPhoto(i)} className="text-xs text-red-500 hover:text-red-700">Kaldır</button>
                  </div>
                );
              }
              return (
                <div key={ph.url} className="space-y-3 p-4 rounded-xl border border-border bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {i === 0 ? "⭐ Kapak" : `Fotoğraf ${i + 1}`}
                    </span>
                    <button
                      type="button" onClick={() => removePhoto(ph.url)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Kaldır
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative rounded-xl overflow-hidden border border-border bg-secondary/30 flex-shrink-0"
                      style={{ width: 100, aspectRatio: "3/4" }}>
                      <Image
                        src={ph.url} alt="" fill className="object-cover" unoptimized
                        style={{ objectPosition: `${getFocalPoint(ph.url).x}% ${getFocalPoint(ph.url).y}%` }}
                      />
                    </div>
                    <FocalPointPicker
                      src={ph.url}
                      value={getFocalPoint(ph.url)}
                      onChange={(fp) => setFocalPoint(ph.url, fp)}
                      aspectRatio="3/4"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <input
            ref={fileInputRef}
            type="file" accept="image/*" multiple
            onChange={handlePhotoFiles}
            className="block text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-80 cursor-pointer"
          />
          {isUploading && (
            <p className="text-xs text-muted-foreground mt-1 animate-pulse">Fotoğraflar yükleniyor, lütfen bekleyin…</p>
          )}
        </div>
      </div>

      {/* Videos */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h2 className="font-medium text-foreground">Videolar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Birden fazla video yükleyebilirsiniz. İlk video kart hover'ında oynar. Max 500MB, MP4 önerilir.</p>
        </div>
        <div className="space-y-3">
          {videos.map((v, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden border border-border bg-secondary/20">
              {v.uploading ? (
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">Yükleniyor… %{v.progress ?? 0}</p>
                  <div className="w-full bg-border rounded-full h-1 overflow-hidden">
                    <div className="bg-foreground h-1 rounded-full transition-all" style={{ width: `${v.progress ?? 0}%` }} />
                  </div>
                </div>
              ) : v.error ? (
                <div className="px-4 py-3 flex items-center justify-between">
                  <p className="text-xs text-red-500">{v.error}</p>
                  <button type="button" onClick={() => setVideos((p) => p.filter((_, idx) => idx !== i))} className="text-xs text-muted-foreground hover:text-foreground">Kaldır</button>
                </div>
              ) : (
                <>
                  <video src={v.url} className="w-full max-h-48 object-cover bg-black" muted controls preload="metadata" />
                  <div className="px-3 py-1.5 flex items-center justify-between gap-2 bg-secondary/30">
                    <span className="text-[11px] text-muted-foreground truncate max-w-[80%]" title={v.url}>
                      {i === 0 && <span className="mr-1.5 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded-full">Ana</span>}
                      {decodeURIComponent(v.url.split("/").pop() ?? v.url).slice(0, 60)}
                    </span>
                    <button type="button" onClick={() => setVideos((p) => p.filter((_, idx) => idx !== i))}
                      className="text-xs text-red-500 hover:text-red-600 flex-shrink-0">Kaldır</button>
                  </div>
                </>
              )}
            </div>
          ))}
          <label className={`flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-xl px-4 py-3 hover:border-foreground/40 transition-colors ${videoUploading ? "opacity-50 pointer-events-none" : ""}`}>
            <span className="text-xl">🎬</span>
            <span className="text-sm text-muted-foreground">{videoUploading ? "Yükleniyor…" : "+ Video Ekle"}</span>
            <input type="file" accept="video/mp4,video/quicktime,video/*" className="sr-only" disabled={videoUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                const idx = videos.length;
                setVideos((p) => [...p, { url: "", uploading: true, progress: 0 }]);
                setVideoUploading(true);
                try {
                  const url = await uploadFileDirect(file, "artists/videos", (pct) => {
                    setVideos((p) => p.map((v, i) => i === idx ? { ...v, progress: pct } : v));
                  });
                  setVideos((p) => p.map((v, i) => i === idx ? { url } : v));
                } catch (err) {
                  setVideos((p) => p.map((v, i) => i === idx ? { url: "", error: err instanceof Error ? err.message : "Hata" } : v));
                  setError("Video yüklenemedi: " + (err instanceof Error ? err.message : String(err)));
                } finally { setVideoUploading(false); }
              }} />
          </label>
        </div>
      </div>

      {/* Links */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Bağlantılar</h2>
        {[
          { name: "soundcloud_url", label: "SoundCloud", placeholder: "https://soundcloud.com/…" },
          { name: "mixcloud_url", label: "Mixcloud", placeholder: "https://www.mixcloud.com/…" },
          { name: "youtube_url", label: "YouTube", placeholder: "https://www.youtube.com/…" },
          { name: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/…" },
          { name: "spotify_url", label: "Spotify", placeholder: "https://open.spotify.com/…" },
          { name: "website_url", label: "Website", placeholder: "https://…" },
          { name: "presskit_url", label: "Press Kit (EPK)", placeholder: "https://… (PDF veya link)" },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">{field.label}</label>
            <input
              type="url" name={field.name}
              defaultValue={(dj as Record<string, string | undefined>)?.[field.name] ?? ""}
              placeholder={field.placeholder}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
        ))}
      </div>

      {/* Event types */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Etkinlik Tipleri</h2>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map((et) => (
            <button
              key={et.id}
              type="button"
              onClick={() => toggleEventType(et.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                selectedEventTypes.includes(et.id)
                  ? "border-foreground bg-foreground/5 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              <span>{et.emoji}</span>
              {et.label}
              {selectedEventTypes.includes(et.id) && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* YouTube performance links */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h2 className="font-medium text-foreground">Performans Videoları (YouTube)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Canlı performans veya mix video linkleri</p>
        </div>
        <div className="space-y-2">
          {youtubeLinks.map((link, i) => (
            <input
              key={i}
              type="url"
              value={link}
              onChange={(e) => {
                const next = [...youtubeLinks];
                next[i] = e.target.value;
                setYoutubeLinks(next);
              }}
              placeholder={`YouTube video linki ${i + 1}`}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          ))}
          {youtubeLinks.length < 6 && (
            <button
              type="button"
              onClick={() => setYoutubeLinks((prev) => [...prev, ""])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              + Video ekle
            </button>
          )}
        </div>
      </div>

      {/* Concept tags — NOQT konseptleri */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div>
          <h2 className="font-medium text-foreground">İcra Edebildiği Konseptler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bu sanatçının çalabileceği NOQT konseptlerini seç. Planlayıcıda müşteri bu konseptleri seçtiğinde sanatçı önerilerde çıkar.
          </p>
        </div>

        {CONCEPT_CATEGORY_ORDER.map((cat) => {
          const catConcepts = MUSIC_CONCEPTS.filter((c) => c.category === cat);
          if (catConcepts.length === 0) return null;
          const meta = CONCEPT_CATEGORIES[cat];
          return (
            <div key={cat} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{meta.emoji} {meta.label}</p>
              <div className="flex flex-wrap gap-2">
                {catConcepts.map((concept) => {
                  const selected = concepts.includes(concept.id);
                  return (
                    <button
                      key={concept.id}
                      type="button"
                      onClick={() =>
                        setConcepts((prev) =>
                          prev.includes(concept.id)
                            ? prev.filter((c) => c !== concept.id)
                            : [...prev, concept.id]
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                        selected
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-foreground hover:border-foreground/40"
                      }`}
                    >
                      <span>{concept.emoji}</span>{concept.name}
                      {selected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Custom serbest etiketler (opsiyonel) */}
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground">Ek serbest etiket (opsiyonel):</p>
          {concepts.filter((t) => !MUSIC_CONCEPTS.some((c) => c.id === t)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {concepts.filter((t) => !MUSIC_CONCEPTS.some((c) => c.id === t)).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-secondary text-foreground">
                  {tag}
                  <button type="button" onClick={() => removeConcept(tag)} className="opacity-60 hover:opacity-100 transition-opacity leading-none">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text" value={conceptInput} onChange={(e) => setConceptInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addConcept(conceptInput); } }}
              placeholder="Serbest etiket yaz ve Enter'a bas…"
              className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
            <button type="button" onClick={() => addConcept(conceptInput)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors">
              Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Busy dates */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h2 className="font-medium text-foreground">Meşgul Günler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Yalnızca iç kullanım — müşteriye gösterilmez</p>
        </div>
        {busyDates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {busyDates.map((date) => (
              <span key={date} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
                {new Date(date + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                <button type="button" onClick={() => removeBusyDate(date)} className="opacity-60 hover:opacity-100 transition-opacity leading-none">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="date" value={busyDateInput} min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setBusyDateInput(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
          />
          <button type="button" onClick={() => addBusyDate(busyDateInput)} disabled={!busyDateInput}
            className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-40">
            Ekle
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || isUploading}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {isUploading ? "Fotoğraf yükleniyor…" : pending ? "Kaydediliyor…" : dj?.id ? "Güncelle" : "Sanatçı Ekle"}
        </button>
        <Link href="/admin/djler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">İptal</Link>
      </div>
    </form>
  );
}
