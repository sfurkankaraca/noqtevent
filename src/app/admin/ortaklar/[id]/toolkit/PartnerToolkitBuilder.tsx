"use client";

import { useState, useTransition, useRef } from "react";
import { savePartnerToolkit, type ToolkitSpec, type ToolkitPackage } from "./actions";

const SPEC_PRESETS_BY_CATEGORY: Record<string, string[]> = {
  venue: ["Kapasite", "Sahne Ölçüsü", "Kapalı/Açık Alan", "Otopark", "Ses Kısıtlaması", "Bitiş Saati"],
  catering: ["Kişi Başı Fiyat Aralığı", "Minimum Kişi", "Menü Seçenekleri", "Diyet Uyumu (vegan/glutensiz)"],
  decor: ["Masa Adedi Kapasitesi", "Kurulum Süresi", "Sökme Süresi", "Malzeme Teslim Şekli"],
  "photo-video": ["Çekim Süresi", "Teslim Süresi", "Fotoğraf Adedi", "Drone Çekimi"],
  beauty: ["Ekip Büyüklüğü", "Prova Dahil mi?", "Ekipman Getirir mi?"],
  transport: ["Araç Tipi", "Kapasite", "Şehir İçi/Dışı"],
  default: ["Kapasite", "Süre", "Teslim Şekli", "Ekstra Ücret Koşulları"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PartnerToolkitBuilder({ partner }: { partner: Record<string, any> }) {
  const toSlug = (s: string) =>
    s.toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const [slug, setSlug] = useState<string>(partner.slug ?? "");
  const [specs, setSpecs] = useState<ToolkitSpec[]>(
    Array.isArray(partner.tool_data?.specs) ? partner.tool_data.specs : []
  );
  const [packages, setPackages] = useState<ToolkitPackage[]>(
    Array.isArray(partner.tool_data?.packages) ? partner.tool_data.packages : []
  );
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const primaryCategory: string = Array.isArray(partner.category) ? partner.category[0] : "default";
  const presets = SPEC_PRESETS_BY_CATEGORY[primaryCategory] ?? SPEC_PRESETS_BY_CATEGORY.default;

  const toolkitUrl = slug ? `/p/${slug}` : null;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.noqt.events";

  const copyLink = () => {
    if (!toolkitUrl) return;
    navigator.clipboard.writeText(`${origin}${toolkitUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reloadPreview = () => {
    if (iframeRef.current && toolkitUrl) {
      iframeRef.current.src = toolkitUrl + "?t=" + Date.now();
    }
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await savePartnerToolkit({ id: partner.id, slug: slug || null, specs, packages });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setTimeout(reloadPreview, 300);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kayıt başarısız");
      }
    });
  };

  const addSpec = (label = "") => setSpecs((p) => [...p, { label, value: "" }]);
  const updateSpec = (idx: number, patch: Partial<ToolkitSpec>) =>
    setSpecs((p) => p.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const removeSpec = (idx: number) => setSpecs((p) => p.filter((_, i) => i !== idx));

  const addPackage = () => setPackages((p) => [...p, { name: "", price: "", description: "" }]);
  const updatePackage = (idx: number, patch: Partial<ToolkitPackage>) =>
    setPackages((p) => p.map((pkg, i) => (i === idx ? { ...pkg, ...patch } : pkg)));
  const removePackage = (idx: number) => setPackages((p) => p.filter((_, i) => i !== idx));

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";
  const labelCls = "block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2";

  return (
    <div className="flex gap-6 items-start" style={{ minHeight: "calc(100vh - 160px)" }}>
      {/* ── Sol: Form ── */}
      <div className="w-[420px] flex-shrink-0 space-y-6 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 160px)" }}>

        {/* Slug + link */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Toolkit Linki</h2>
            {slug && (
              <a href={toolkitUrl!} target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Sayfayı Aç ↗
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">/p/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)}
                placeholder="firma-adi" className={`${inputCls} pl-8 font-mono`} />
            </div>
            <button type="button" onClick={() => setSlug(toSlug(partner.business_name ?? ""))}
              className="text-xs px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0">
              Üret
            </button>
          </div>
          {slug && (
            <div className="flex gap-2">
              <button type="button" onClick={copyLink}
                className="flex-1 text-xs py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors">
                {copied ? "✓ Kopyalandı" : "Linki Kopyala"}
              </button>
              <button type="button" onClick={reloadPreview}
                className="text-xs px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
                ↻
              </button>
            </div>
          )}
        </div>

        {/* Teknik Detaylar / Specs */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Teknik Detaylar</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organizasyon şirketinin ihtiyacı olan bilgiler — kapasite, süre, koşullar vb.
            </p>
          </div>

          {specs.length > 0 && (
            <div className="space-y-2">
              {specs.map((s, idx) => (
                <div key={idx} className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
                  <input value={s.label} onChange={(e) => updateSpec(idx, { label: e.target.value })}
                    placeholder="Başlık (ör. Kapasite)" className={inputCls} />
                  <input value={s.value} onChange={(e) => updateSpec(idx, { value: e.target.value })}
                    placeholder="Değer (ör. 300 kişi)" className={inputCls} />
                  <button type="button" onClick={() => removeSpec(idx)}
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addSpec()}
              className="text-xs px-4 py-2 border border-dashed border-border rounded-full text-foreground hover:border-foreground/50 transition-colors">
              + Detay Ekle
            </button>
          </div>

          {presets.length > 0 && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground">Hızlı ekle ({primaryCategory}):</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => {
                  const already = specs.some((s) => s.label === preset);
                  return (
                    <button key={preset} type="button" disabled={already}
                      onClick={() => addSpec(preset)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        already ? "border-border text-muted-foreground opacity-40" : "border-border text-foreground hover:bg-foreground hover:text-background"
                      }`}>
                      {already ? "✓ " : "+ "}{preset}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Paketler */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Paketler / Fiyatlandırma</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hazır paketler veya menü seçenekleri — müşteri teklif formunda ayrıca fiyat alacağı için burası opsiyoneldir.
            </p>
          </div>

          {packages.length > 0 && (
            <div className="space-y-3">
              {packages.map((pkg, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border bg-secondary/10 space-y-2">
                  <div className="flex gap-2">
                    <input value={pkg.name} onChange={(e) => updatePackage(idx, { name: e.target.value })}
                      placeholder="Paket adı" className={inputCls} />
                    <input value={pkg.price} onChange={(e) => updatePackage(idx, { price: e.target.value })}
                      placeholder="Fiyat" className={`${inputCls} w-32 flex-shrink-0`} />
                    <button type="button" onClick={() => removePackage(idx)}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <textarea value={pkg.description} onChange={(e) => updatePackage(idx, { description: e.target.value })}
                    rows={2} placeholder="Paket açıklaması…" className={`${inputCls} resize-none text-xs`} />
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={addPackage}
            className="text-xs px-4 py-2 border border-dashed border-border rounded-full text-foreground hover:border-foreground/50 transition-colors">
            + Paket Ekle
          </button>
        </div>

        {/* Kaydet */}
        <div className="pb-6">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">{error}</p>
          )}
          <button type="button" onClick={handleSave} disabled={isPending}
            className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? "Kaydediliyor…" : saved ? "✓ Kaydedildi" : "Toolkit'i Kaydet"}
          </button>
        </div>
      </div>

      {/* ── Sağ: Önizleme ── */}
      <div className="flex-1 flex flex-col" style={{ minHeight: "calc(100vh - 160px)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Önizleme</span>
          {toolkitUrl ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">noqt.events/p/{slug}</span>
              <button type="button" onClick={reloadPreview}
                className="text-xs px-3 py-1.5 border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors">
                Yenile
              </button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Slug gir ve kaydet</span>
          )}
        </div>

        <div className="flex-1 rounded-2xl border border-border overflow-hidden bg-secondary/10">
          {toolkitUrl ? (
            <iframe ref={iframeRef} src={toolkitUrl} className="w-full h-full"
              style={{ minHeight: "calc(100vh - 220px)" }} title="Toolkit Önizleme" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground"
              style={{ minHeight: "calc(100vh - 220px)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              <p className="text-sm">Önizleme için slug belirle ve kaydet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
