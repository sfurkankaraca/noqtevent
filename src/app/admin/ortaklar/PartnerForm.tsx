"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { upsertPartner } from "./actions";
import FocalPointPicker, { type FocalPoint } from "@/components/admin/FocalPointPicker";

export const PARTNER_CATEGORIES = [
  { id: "venue", label: "Mekan", emoji: "🏛️" },
  { id: "photo-video", label: "Fotoğraf & Video", emoji: "📸" },
  { id: "decor", label: "Dekorasyon & Çiçek", emoji: "🌸" },
  { id: "catering", label: "Catering & İkram", emoji: "🍽️" },
  { id: "cake", label: "Pasta & Tatlı", emoji: "🎂" },
  { id: "beauty", label: "Güzellik & Bakım", emoji: "💄" },
  { id: "transport", label: "Ulaşım & Transfer", emoji: "🚗" },
  { id: "invitation", label: "Davetiye & Tasarım", emoji: "✉️" },
  { id: "dance-class", label: "Dans Kursu", emoji: "💃" },
  { id: "planning", label: "Organizasyon & Planlama", emoji: "📋" },
];

const CITIES = ["Kayseri", "Nevşehir", "İstanbul", "İzmir", "Ankara", "Antalya", "Bursa", "Bodrum", "Çeşme", "Muğla"];

type Partner = {
  id?: string;
  business_name?: string;
  description?: string;
  logo_url?: string;
  email?: string;
  phone?: string;
  contact_name?: string;
  category?: string[];
  services?: string[];
  city?: string;
  cover_cities?: string[];
  instagram_url?: string;
  website_url?: string;
  photos?: string[];
  focal_points?: Record<string, FocalPoint>;
  is_active?: boolean;
  application_status?: string;
};

interface PhotoEntry {
  url: string;
  uploading?: boolean;
  error?: string;
}

async function uploadFile(file: File, folder: string): Promise<string> {
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
    xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`Yükleme hatası: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Ağ hatası"));
    xhr.send(file);
  });
  return publicUrl;
}

export default function PartnerForm({ partner }: { partner?: Partner }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(partner?.logo_url ?? null);
  const [logoUploading, setLogoUploading] = useState(false);

  const initPhotos: PhotoEntry[] = (partner?.photos ?? []).map((url) => ({ url }));
  const [photos, setPhotos] = useState<PhotoEntry[]>(initPhotos);
  const [focalPoints, setFocalPoints] = useState<Record<string, FocalPoint>>(
    partner?.focal_points ?? {}
  );

  const [categories, setCategories] = useState<string[]>(partner?.category ?? []);
  const [services, setServices] = useState<string[]>(partner?.services ?? []);
  const [serviceInput, setServiceInput] = useState("");
  const [coverCities, setCoverCities] = useState<string[]>(partner?.cover_cities ?? []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = logoUploading || photos.some((p) => p.uploading);

  const toggleCategory = (id: string) =>
    setCategories((p) => (p.includes(id) ? p.filter((c) => c !== id) : [...p, id]));
  const toggleCity = (city: string) =>
    setCoverCities((p) => (p.includes(city) ? p.filter((c) => c !== city) : [...p, city]));

  const addService = () => {
    const s = serviceInput.trim();
    if (!s || services.includes(s)) return;
    setServices((p) => [...p, s]);
    setServiceInput("");
  };
  const removeService = (s: string) => setServices((p) => p.filter((x) => x !== s));

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadFile(file, "partners/logos");
      setLogoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo yükleme hatası");
    } finally {
      setLogoUploading(false);
    }
  };

  const handlePortfolioFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    const placeholders: PhotoEntry[] = files.map(() => ({ url: "", uploading: true }));
    setPhotos((p) => [...p, ...placeholders]);

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile(files[i], "partners/photos");
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
    setFocalPoints((prev) => { const n = { ...prev }; delete n[url]; return n; });
  };

  const removeErrorPhoto = (idx: number) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const getFocalPoint = (url: string): FocalPoint => focalPoints[url] ?? { x: 50, y: 50 };
  const setFocalPoint = (url: string, fp: FocalPoint) =>
    setFocalPoints((prev) => ({ ...prev, [url]: fp }));

  const handleAction = async (fd: FormData) => {
    fd.set("category_json", JSON.stringify(categories));
    fd.set("services_json", JSON.stringify(services));
    fd.set("cover_cities_json", JSON.stringify(coverCities));
    if (logoUrl) fd.set("logo_url", logoUrl);

    const readyPhotos = photos.filter((p) => p.url && !p.uploading && !p.error);
    fd.set("photos_json", JSON.stringify(readyPhotos.map((p) => p.url)));

    const fpPayload: Record<string, FocalPoint> = {};
    readyPhotos.forEach((ph) => { fpPayload[ph.url] = getFocalPoint(ph.url); });
    fd.set("focal_points_json", JSON.stringify(fpPayload));

    setPending(true);
    setError(null);
    try {
      await upsertPartner(fd);
      router.push("/admin/ortaklar");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setPending(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";
  const labelCls = "block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2";

  return (
    <form action={handleAction} className="space-y-6 max-w-2xl">
      {partner?.id && <input type="hidden" name="id" value={partner.id} />}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-medium text-foreground">Firma Bilgileri</h2>

        <div>
          <label className={labelCls}>Firma Adı</label>
          <input type="text" name="business_name" defaultValue={partner?.business_name} required placeholder="Firma Adı"
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Açıklama</label>
          <textarea name="description" defaultValue={partner?.description ?? ""} rows={3}
            placeholder="Firma hakkında kısa bir tanıtım…"
            className={`${inputCls} resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Şehir</label>
            <input type="text" name="city" defaultValue={partner?.city ?? ""} placeholder="ör. Kayseri" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Aktif</label>
            <select name="is_active" defaultValue={partner?.is_active !== false ? "true" : "false"} className={inputCls}>
              <option value="true">Evet</option>
              <option value="false">Hayır</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Yetkili</label>
            <input type="text" name="contact_name" defaultValue={partner?.contact_name ?? ""} placeholder="Ad Soyad" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>E-posta</label>
            <input type="email" name="email" defaultValue={partner?.email ?? ""} placeholder="firma@example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Telefon</label>
            <input type="tel" name="phone" defaultValue={partner?.phone ?? ""} placeholder="+90 5xx xxx xx xx" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Instagram</label>
            <input type="url" name="instagram_url" defaultValue={partner?.instagram_url ?? ""} placeholder="https://instagram.com/…" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input type="url" name="website_url" defaultValue={partner?.website_url ?? ""} placeholder="https://…" className={inputCls} />
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className={labelCls}>Logo</label>
          <div className="flex items-center gap-4">
            {logoUrl && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-secondary/30 flex-shrink-0">
                <Image src={logoUrl} alt="Logo" fill className="object-contain p-2" unoptimized />
              </div>
            )}
            {logoUploading && <span className="text-xs text-muted-foreground animate-pulse">Yükleniyor…</span>}
            <input type="file" accept="image/*" onChange={handleLogoFile}
              className="block text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-80 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Kategori */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Hizmet Kategorileri</h2>
        <div className="grid grid-cols-2 gap-2">
          {PARTNER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                categories.includes(cat.id)
                  ? "border-foreground bg-foreground/5 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
              {categories.includes(cat.id) && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Hizmet bölgeleri */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Hizmet Verilen Şehirler</h2>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => toggleCity(city)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                coverCities.includes(city)
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-foreground hover:border-foreground/40"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Hizmetler</h2>
        {services.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-secondary text-foreground">
                {s}
                <button type="button" onClick={() => removeService(s)} className="opacity-60 hover:opacity-100 transition-opacity leading-none">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input type="text" value={serviceInput} onChange={(e) => setServiceInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
            placeholder="Hizmet adı yaz ve Enter'a bas (ör. Gelin Arabası)"
            className={inputCls} />
          <button type="button" onClick={addService} disabled={!serviceInput.trim()}
            className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-40 flex-shrink-0">
            Ekle
          </button>
        </div>
      </div>

      {/* Portfolio */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div>
          <h2 className="font-medium text-foreground">Portföy Görselleri</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Yükleme seçince otomatik başlar. Her görsel için odak noktası ayarlayabilirsin.</p>
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
                      {i === 0 ? "⭐ Kapak" : `Görsel ${i + 1}`}
                    </span>
                    <button type="button" onClick={() => removePhoto(ph.url)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors">Kaldır</button>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative rounded-xl overflow-hidden border border-border bg-secondary/30 flex-shrink-0"
                      style={{ width: 100, aspectRatio: "16/9" }}>
                      <Image src={ph.url} alt="" fill className="object-cover" unoptimized
                        style={{ objectPosition: `${getFocalPoint(ph.url).x}% ${getFocalPoint(ph.url).y}%` }} />
                    </div>
                    <FocalPointPicker src={ph.url} value={getFocalPoint(ph.url)}
                      onChange={(fp) => setFocalPoint(ph.url, fp)} aspectRatio="16/9" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePortfolioFiles}
            className="block text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-80 cursor-pointer" />
          {photos.some((p) => p.uploading) && (
            <p className="text-xs text-muted-foreground mt-1 animate-pulse">Görseller yükleniyor…</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || isUploading}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {isUploading ? "Görseller yükleniyor…" : pending ? "Kaydediliyor…" : partner?.id ? "Güncelle" : "Ortak Ekle"}
        </button>
        <Link href="/admin/ortaklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">İptal</Link>
      </div>
    </form>
  );
}
