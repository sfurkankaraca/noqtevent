"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadAsset } from "./actions";

const CATEGORIES = [
  { id: "hero", label: "Hero / Ana Görsel" },
  { id: "events", label: "Etkinlik Görselleri" },
  { id: "artists", label: "Sanatçı Fotoğrafları" },
  { id: "brands", label: "Marka / Ortak Logoları" },
  { id: "journal", label: "Journal / Blog" },
  { id: "other", label: "Diğer" },
];

export default function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleAction = async (fd: FormData) => {
    setPending(true);
    setError(null);
    try {
      await uploadAsset(fd);
      formRef.current?.reset();
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setPending(false);
    }
  };

  return (
    <form ref={formRef} action={handleAction} className="bg-white rounded-2xl border border-border p-6 space-y-4">
      <h2 className="font-medium text-foreground">Yeni Görsel Yükle</h2>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
            Kategori
          </label>
          <select
            name="category"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
          >
            <option value="">Seç…</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
            Etiket / Açıklama
          </label>
          <input
            type="text"
            name="label"
            required
            placeholder="ör. Hero Arka Plan, DJ Ahmet"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
          Görsel Dosyası
        </label>
        <input
          type="file"
          name="file"
          accept="image/*"
          required
          onChange={handleFile}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-80 cursor-pointer"
        />
        {preview && (
          <div className="mt-3 relative h-40 rounded-xl overflow-hidden border border-border">
            <Image src={preview} alt="Önizleme" fill className="object-cover" unoptimized />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Yükleniyor…" : "Yükle"}
      </button>
    </form>
  );
}
