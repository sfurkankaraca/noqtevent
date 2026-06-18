"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { upsertPartner } from "./actions";
import FocalPointPicker, { type FocalPoint } from "@/components/admin/FocalPointPicker";

const SERVICE_CATEGORIES = [
  "Mekan", "Müzik & Teknik", "Görsel & Video", "Stil & Güzellik",
  "Çiçek & Dekor", "Yiyecek & İçecek", "Lojistik & Ulaşım", "Dijital & Baskı", "Diğer",
];

type Service = { name: string; price_range: string };

type Partner = {
  id?: string;
  company_name?: string;
  description?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  service_category?: string;
  services?: Service[];
  portfolio_images?: string[];
  focal_points?: Record<string, FocalPoint>;
  is_active?: boolean;
};

interface PhotoEntry {
  url: string;
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

export default function PartnerForm({ partner }: { partner?: Partner }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(partner?.logo_url ?? null);
  const [logoUploading, setLogoUploading] = useState(false);

  const initPhotos: PhotoEntry[] = (partner?.portfolio_images ?? []).map((url) => ({ url }));
  const [photos, setPhotos] = useState<PhotoEntry[]>(initPhotos);
  const [focalPoints, setFocalPoints] = useState<Record<string, FocalPoint>>(
    partner?.focal_points ?? {}
  );

  const [services, setServices] = useState<Service[]>(partner?.services ?? []);
  const [serviceInput, setServiceInput] = useState({ name: "", price_range: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = logoUploading || photos.some((p) => p.uploading);

  const addService = () => {
    if (!serviceInput.name) return;
    setServices((p) => [...p, { ...serviceInput }]);
    setServiceInput({ name: "", price_range: "" });
  };
  const removeService = (i: number) => setServices((p) => p.filter((_, idx) => idx !== i));

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadFile(file, "partners/logo");
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
        const url = await uploadFile(files[i], "partners/portfolio");
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
    fd.set("services_json", JSON.stringify(services));
    if (logoUrl) fd.set("logo_url", logoUrl);

    const readyPhotos = photos.filter((p) => p.url && !p.uploading && !p.error);
    fd.set("portfolio_json", JSON.stringify(readyPhotos.map((p) => p.url)));

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
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Firma Adı</label>
          <input type="text" name="company_name" defaultValue={partner?.company_name} required placeholder="Firma Adı"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40" />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Açıklama</label>
          <textarea name="description" defaultValue={partner?.description ?? ""} rows={3}
            placeholder="Firma hakkında kısa bir tanıtım…"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Hizmet Kategorisi</label>
            <select name="service_category" defaultValue={partner?.service_category ?? ""} required
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40">
              <option value="">Seç…</option>
              {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Aktif</label>
            <select name="is_active" defaultValue={partner?.is_active !== false ? "true" : "false"}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40">
              <option value="true">Evet</option>
              <option value="false">Hayır</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">E-posta</label>
            <input type="email" name="contact_email" defaultValue={partner?.contact_email ?? ""} placeholder="firma@example.com"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Telefon</label>
            <input type="tel" name="contact_phone" defaultValue={partner?.contact_phone ?? ""} placeholder="+90 5xx xxx xx xx"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40" />
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Logo</label>
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

      {/* Services */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Hizmetler</h2>
        {services.length > 0 && (
          <div className="space-y-2">
            {services.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/40 text-sm">
                <span className="font-medium text-foreground">{s.name}</span>
                <div className="flex items-center gap-3">
                  {s.price_range && <span className="text-xs text-muted-foreground">{s.price_range}</span>}
                  <button type="button" onClick={() => removeService(i)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Kaldır</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input type="text" value={serviceInput.name} onChange={(e) => setServiceInput((p) => ({ ...p, name: e.target.value }))}
            placeholder="Hizmet adı (ör. DJ Set)"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40" />
          <input type="text" value={serviceInput.price_range} onChange={(e) => setServiceInput((p) => ({ ...p, price_range: e.target.value }))}
            placeholder="Fiyat aralığı" className="w-36 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40" />
          <button type="button" onClick={addService} disabled={!serviceInput.name}
            className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-40">
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
