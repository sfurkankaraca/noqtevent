"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { upsertDj } from "./actions";
import FocalPointPicker, { type FocalPoint } from "@/components/admin/FocalPointPicker";

const CONCEPT_SUGGESTIONS = [
  "Sunset Ritual", "Disco Romance", "Modern Club", "Mixtape",
  "Girls Night", "Throwback 2000s", "Turkish 90s", "Turkish 2000s",
  "After Dark", "Deep House", "Tech House", "Latin Vibes",
];

type Dj = {
  id?: string;
  name?: string;
  bio?: string;
  photo_url?: string;
  photos?: string[];
  focal_points?: Record<string, FocalPoint>;
  soundcloud_url?: string;
  mixcloud_url?: string;
  youtube_url?: string;
  concept_tags?: string[];
  busy_dates?: string[];
  is_active?: boolean;
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const url = await uploadFile(files[i], "dj");
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

    const readyPhotos = photos.filter((p) => p.url && !p.uploading && !p.error);
    fd.set("photos_json", JSON.stringify(readyPhotos.map((p) => p.url)));

    const fpPayload: Record<string, FocalPoint> = {};
    readyPhotos.forEach((ph) => {
      fpPayload[ph.url] = getFocalPoint(ph.url);
    });
    fd.set("focal_points_json", JSON.stringify(fpPayload));

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

        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">İsim</label>
          <input
            type="text" name="name" defaultValue={dj?.name} required placeholder="DJ Adı"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Biyografi</label>
          <textarea
            name="bio" defaultValue={dj?.bio ?? ""} rows={4}
            placeholder="DJ hakkında kısa bir tanıtım yazısı…"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 resize-none"
          />
        </div>

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

      {/* Links */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Bağlantılar</h2>
        {[
          { name: "soundcloud_url", label: "SoundCloud", placeholder: "https://soundcloud.com/…" },
          { name: "mixcloud_url", label: "Mixcloud", placeholder: "https://www.mixcloud.com/…" },
          { name: "youtube_url", label: "YouTube", placeholder: "https://www.youtube.com/…" },
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

      {/* Concept tags */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Konsept Etiketleri</h2>
        {concepts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {concepts.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-foreground text-background">
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
            placeholder="Konsept adı yaz ve Enter'a bas…"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
          />
          <button type="button" onClick={() => addConcept(conceptInput)}
            className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors">
            Ekle
          </button>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Hızlı seçim:</p>
          <div className="flex flex-wrap gap-2">
            {CONCEPT_SUGGESTIONS.filter((s) => !concepts.includes(s)).map((s) => (
              <button key={s} type="button" onClick={() => addConcept(s)}
                className="px-3 py-1.5 rounded-full text-xs border border-border text-foreground hover:bg-secondary transition-colors">
                + {s}
              </button>
            ))}
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
          {isUploading ? "Fotoğraf yükleniyor…" : pending ? "Kaydediliyor…" : dj?.id ? "Güncelle" : "DJ Ekle"}
        </button>
        <Link href="/admin/djler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">İptal</Link>
      </div>
    </form>
  );
}
