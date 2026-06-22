"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { saveAssetRecord } from "./actions";

const CATEGORIES = [
  { id: "hero", label: "Hero / Ana Görsel" },
  { id: "brand-feed", label: "Deneyimler Anlatıyor (Dönen Kartlar)" },
  { id: "memory-drive", label: "Memory Drive Galerisi" },
  { id: "events", label: "Etkinlik Görselleri" },
  { id: "artists", label: "Sanatçı Fotoğrafları" },
  { id: "brands", label: "Partner Logoları (Anasayfa Marquee)" },
  { id: "journal", label: "Journal / Blog" },
  { id: "other", label: "Diğer" },
];

async function uploadDirect(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<{ url: string; path: string }> {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, filename: file.name, contentType: file.type }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "URL alınamadı");
  }
  const { signedUrl, publicUrl, path } = await res.json();

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

  return { url: publicUrl, path };
}

export default function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current!;
    const file = (form.querySelector('input[name="file"]') as HTMLInputElement).files?.[0];
    const category = (form.querySelector('select[name="category"]') as HTMLSelectElement).value;
    const label = (form.querySelector('input[name="label"]') as HTMLInputElement).value.trim();

    if (!file || !category || !label) {
      setError("Tüm alanları doldur");
      return;
    }

    setPending(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const { url, path: filePath } = await uploadDirect(file, category, setProgress);
      await saveAssetRecord({ category, label, publicUrl: url, filePath });
      form.reset();
      setPreview(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setPending(false);
      setProgress(0);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 space-y-4">
      <h2 className="font-medium text-foreground">Yeni Görsel Yükle</h2>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          Görsel başarıyla yüklendi ve kayıt edildi ✓
        </p>
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
          Görsel / Video Dosyası
        </label>
        <input
          type="file"
          name="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
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

      {pending && progress > 0 && (
        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-foreground h-1.5 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            {progress > 0 ? `Yükleniyor… %${progress}` : "Hazırlanıyor…"}
          </>
        ) : "Yükle"}
      </button>
    </form>
  );
}
