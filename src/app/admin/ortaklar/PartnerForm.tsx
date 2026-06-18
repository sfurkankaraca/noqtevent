"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { upsertPartner } from "./actions";

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
  is_active?: boolean;
};

export default function PartnerForm({ partner }: { partner?: Partner }) {
  const [logoPreview, setLogoPreview] = useState<string | null>(partner?.logo_url ?? null);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>(partner?.portfolio_images ?? []);
  const [services, setServices] = useState<Service[]>(partner?.services ?? []);
  const [serviceInput, setServiceInput] = useState({ name: "", price_range: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const addService = () => {
    if (!serviceInput.name) return;
    setServices((p) => [...p, { ...serviceInput }]);
    setServiceInput({ name: "", price_range: "" });
  };

  const removeService = (i: number) => setServices((p) => p.filter((_, idx) => idx !== i));

  const handlePortfolioFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPortfolioPreviews((p) => [...p, ...urls]);
  };

  const removePortfolioPreview = (url: string) =>
    setPortfolioPreviews((p) => p.filter((u) => u !== url));

  const handleAction = async (fd: FormData) => {
    fd.set("services_json", JSON.stringify(services));
    const existingImages = portfolioPreviews.filter((u) => !u.startsWith("blob:"));
    fd.set("existing_portfolio", JSON.stringify(existingImages));
    setPending(true);
    setError(null);
    try {
      await upsertPartner(fd);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setPending(false);
    }
  };

  return (
    <form ref={formRef} action={handleAction} className="space-y-6 max-w-2xl">
      {partner?.id && <input type="hidden" name="id" value={partner.id} />}
      {partner?.logo_url && <input type="hidden" name="existing_logo_url" value={partner.logo_url} />}
      <input type="hidden" name="services_json" value={JSON.stringify(services)} />
      <input type="hidden" name="existing_portfolio" value={JSON.stringify(portfolioPreviews.filter((u) => !u.startsWith("blob:")))} />

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
            <input type="email" name="contact_email" defaultValue={partner?.contact_email ?? ""}
              placeholder="firma@example.com"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Telefon</label>
            <input type="tel" name="contact_phone" defaultValue={partner?.contact_phone ?? ""}
              placeholder="+90 5xx xxx xx xx"
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
                  <button type="button" onClick={() => removeService(i)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors">Kaldır</button>
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
            placeholder="Fiyat aralığı"
            className="w-36 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40" />
          <button type="button" onClick={addService} disabled={!serviceInput.name}
            className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-40">
            Ekle
          </button>
        </div>
      </div>

      {/* Portfolio */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Portföy Görselleri</h2>

        {portfolioPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {portfolioPreviews.map((url) => (
              <div key={url} className="relative group aspect-video rounded-xl overflow-hidden border border-border bg-secondary/30">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
                <button type="button" onClick={() => removePortfolioPreview(url)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input type="file" name="portfolio_files" accept="image/*" multiple onChange={handlePortfolioFiles}
          className="block text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-80 cursor-pointer" />
        <p className="text-xs text-muted-foreground">Birden fazla görsel seçebilirsin</p>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? "Kaydediliyor…" : partner?.id ? "Güncelle" : "Ortak Ekle"}
        </button>
        <Link href="/admin/ortaklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          İptal
        </Link>
      </div>
    </form>
  );
}
