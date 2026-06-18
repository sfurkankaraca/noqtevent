"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { upsertDj } from "./actions";

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
  soundcloud_url?: string;
  mixcloud_url?: string;
  youtube_url?: string;
  concept_tags?: string[];
  busy_dates?: string[];
  is_active?: boolean;
};

export default function DjForm({ dj }: { dj?: Dj }) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(dj?.photo_url ?? null);
  const [conceptInput, setConceptInput] = useState("");
  const [concepts, setConcepts] = useState<string[]>(dj?.concept_tags ?? []);
  const [busyDates, setBusyDates] = useState<string[]>(dj?.busy_dates ?? []);
  const [busyDateInput, setBusyDateInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  const handleAction = async (fd: FormData) => {
    fd.set("concept_tags", concepts.join(","));
    fd.set("busy_dates", busyDates.join(","));
    setPending(true);
    setError(null);
    try {
      await upsertDj(fd);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setPending(false);
    }
  };

  return (
    <form ref={formRef} action={handleAction} className="space-y-6 max-w-2xl">
      {dj?.id && <input type="hidden" name="id" value={dj.id} />}
      {dj?.photo_url && <input type="hidden" name="existing_photo_url" value={dj.photo_url} />}
      <input type="hidden" name="concept_tags" value={concepts.join(",")} />
      <input type="hidden" name="busy_dates" value={busyDates.join(",")} />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-medium text-foreground">Profil Bilgileri</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
              İsim
            </label>
            <input
              type="text"
              name="name"
              defaultValue={dj?.name}
              required
              placeholder="DJ Adı"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
              Biyografi
            </label>
            <textarea
              name="bio"
              defaultValue={dj?.bio ?? ""}
              rows={4}
              placeholder="DJ hakkında kısa bir tanıtım yazısı…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 resize-none"
            />
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
            Profil Fotoğrafı
          </label>
          <div className="flex items-start gap-4">
            {photoPreview && (
              <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border flex-shrink-0">
                <Image src={photoPreview} alt="Önizleme" fill className="object-cover" unoptimized />
              </div>
            )}
            <input
              type="file"
              name="photo_file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhotoPreview(URL.createObjectURL(f));
              }}
              className="block text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-80 cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            Aktif
          </label>
          <select
            name="is_active"
            defaultValue={dj?.is_active !== false ? "true" : "false"}
            className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
          >
            <option value="true">Evet</option>
            <option value="false">Hayır</option>
          </select>
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
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
              {field.label}
            </label>
            <input
              type="url"
              name={field.name}
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

        {/* Selected tags */}
        {concepts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {concepts.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-foreground text-background"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeConcept(tag)}
                  className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Manual input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={conceptInput}
            onChange={(e) => setConceptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addConcept(conceptInput); }
            }}
            placeholder="Konsept adı yaz ve Enter'a bas…"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
          />
          <button
            type="button"
            onClick={() => addConcept(conceptInput)}
            className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors"
          >
            Ekle
          </button>
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Hızlı seçim:</p>
          <div className="flex flex-wrap gap-2">
            {CONCEPT_SUGGESTIONS.filter((s) => !concepts.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addConcept(s)}
                className="px-3 py-1.5 rounded-full text-xs border border-border text-foreground hover:bg-secondary transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Busy dates — internal only, never shown to customers */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h2 className="font-medium text-foreground">Meşgul Günler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Yalnızca iç kullanım — müşteriye gösterilmez
          </p>
        </div>

        {busyDates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {busyDates.map((date) => (
              <span
                key={date}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200"
              >
                {new Date(date + "T00:00:00").toLocaleDateString("tr-TR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
                <button
                  type="button"
                  onClick={() => removeBusyDate(date)}
                  className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="date"
            value={busyDateInput}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setBusyDateInput(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
          />
          <button
            type="button"
            onClick={() => addBusyDate(busyDateInput)}
            disabled={!busyDateInput}
            className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
          >
            Ekle
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : dj?.id ? "Güncelle" : "DJ Ekle"}
        </button>
        <Link href="/admin/djler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          İptal
        </Link>
      </div>
    </form>
  );
}
