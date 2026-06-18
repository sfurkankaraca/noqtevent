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
  isNew: boolean;
  file?: File;
}

export default function PartnerForm({ partner }: { partner?: Partner }) {
  const router = useRouter();
  const [logoPreview, setLogoPreview] = useState<string | null>(partner?.logo_url ?? null);

  const initPhotos: PhotoEntry[] = (partner?.portfolio_images ?? []).map((url) => ({
    url,
    isNew: false,
  }));
  const [photos, setPhotos] = useState<PhotoEntry[]>(initPhotos);
  const [focalPoints, setFocalPoints] = useState<Record<string, FocalPoint>>(
    partner?.focal_points ?? {}
  );

  const [services, setServices] = useState<Service[]>(partner?.services ?? []);
  const [serviceInput, setServiceInput] = useState({ name: "", price_range: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addService = () => {
    if (!serviceInput.name) return;
    setServices((p) => [...p, { ...serviceInput }]);
    setServiceInput({ name: "", price_range: "" });
  };
  const removeService = (i: number) => setServices((p) => p.filter((_, idx) => idx !== i));

  const handlePortfolioFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newEntries: PhotoEntry[] = files.map((f) => ({
      url: URL.createObjectURL(f),
      isNew: true,
      file: f,
    }));
    setPhotos((p) => [...p, ...newEntries]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (url: string) => {
    setPhotos((p) => p.filter((ph) => ph.url !== url));
    setFocalPoints((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  };

  const getFocalPoint = (url: string): FocalPoint =>
    focalPoints[url] ?? { x: 50, y: 50 };

  const setFocalPoint = (url: string, fp: FocalPoint) =>
    setFocalPoints((prev) => ({ ...prev, [url]: fp }));

  const handleAction = async (fd: FormData) => {
    fd.set("services_json", JSON.stringify(services));

    const existingUrls = photos.filter((p) => !p.isNew).map((p) => p.url);
    fd.set("existing_portfolio", JSON.stringify(existingUrls));

    photos.filter((p) => p.isNew && p.file).forEach((p) => fd.append("portfolio_files", p.file!));

    // Focal points: "new:N" for new photos, url for existing
    const fpPayload: Record<string, FocalPoint> = {};
    photos.forEach((ph, i) => {
      const fp = getFocalPoint(ph.url);
      if (ph.isNew) {
        fpPayload[`new:${i}`] = fp;
      } else {
        fpPayload[ph.url] = fp;
      }
    });
    fd.set("focal_points_json", JSON.stringify(fpPayload));

    const order = photos.map((ph, i) => (ph.isNew ? `new:${i}` : ph.url));
    fd.set("photo_order", JSON.stringify(order));

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
    <form ref={formRef} action={handleAction} className="space-y-6 max-w-2xl">
      {partner?.id && <input type="hidden" name="id" value={partner.id} />}
      {partner?.logo_url && <input type="hidden" name="existing_logo_url" value={partner.logo_url} />}
      <input type="hidden" name="services_json" value={JSON.stringify(services)} />
      <input type="hidden" name="existing_portfolio" value={JSON.stringify(photos.filter((p) => !p.isNew).map((p) => p.url))} />

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
            {logoPreview && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-secondary/30 flex-shrink-0">
                <Image src={logoPreview} alt="Logo" fill className="object-contain p-2" unoptimized />
              </div>
            )}
            <input type="file" name="logo_file" accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setLogoPreview(URL.createObjectURL(f)); }}
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
          <p className="text-xs text-muted-foreground mt-0.5">Her görsel için odak noktası ayarlayabilirsin.</p>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {photos.map((ph, i) => (
              <div key={ph.url} className="space-y-3 p-4 rounded-xl border border-border bg-secondary/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {i === 0 ? "⭐ Kapak" : `Görsel ${i + 1}`}
                  </span>
                  <button type="button" onClick={() => removePhoto(ph.url)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors">
                    Kaldır
                  </button>
                </div>
                <div className="flex gap-4">
                  <div className="relative rounded-xl overflow-hidden border border-border bg-secondary/30 flex-shrink-0"
                    style={{ width: 100, aspectRatio: "16/9" }}>
                    <Image src={ph.url} alt="" fill className="object-cover" unoptimized
                      style={{ objectPosition: `${getFocalPoint(ph.url).x}% ${getFocalPoint(ph.url).y}%` }} />
                  </div>
                  <FocalPointPicker
                    src={ph.url}
                    value={getFocalPoint(ph.url)}
                    onChange={(fp) => setFocalPoint(ph.url, fp)}
                    aspectRatio="16/9"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <input
            ref={fileInputRef}
            type="file" name="portfolio_files" accept="image/*" multiple
            onChange={handlePortfolioFiles}
            className="block text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-80 cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">Birden fazla görsel seçebilirsin</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? "Kaydediliyor…" : partner?.id ? "Güncelle" : "Ortak Ekle"}
        </button>
        <Link href="/admin/ortaklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">İptal</Link>
      </div>
    </form>
  );
}
