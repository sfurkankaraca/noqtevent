"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { upsertPartner } from "./actions";
import { PARTNER_SERVICES, PARTNER_SERVICE_GROUP_ORDER, PARTNER_SERVICE_GROUP_META } from "@/components/planner/PlannerStore";

const EVENT_TYPES = [
  { id: "wedding", label: "Düğün / Nikah" },
  { id: "kina", label: "Kına Gecesi" },
  { id: "graduation", label: "Mezuniyet" },
  { id: "birthday", label: "Doğum Günü" },
  { id: "bride", label: "Bekarlığa Veda" },
  { id: "morning-party", label: "Morning Party" },
  { id: "corporate", label: "Kurumsal Etkinlik" },
  { id: "after-party", label: "After Party" },
  { id: "cocktail", label: "Kokteyl / Resepsiyon" },
  { id: "festival", label: "Festival / Açık Hava" },
];

type Partner = {
  id?: string;
  business_name?: string;
  category?: string[];
  description?: string;
  services?: string[];
  event_types?: string[];
  logo_url?: string;
  photos?: string[];
  city?: string;
  cover_cities?: string[];
  instagram_url?: string;
  website_url?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  application_status?: string;
  is_active?: boolean;
};

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

  const [categories, setCategories] = useState<string[]>(partner?.category ?? []);
  const [eventTypes, setEventTypes] = useState<string[]>(partner?.event_types ?? []);
  const [coverCities, setCoverCities] = useState<string[]>(partner?.cover_cities ?? []);
  const [cityInput, setCityInput] = useState("");
  const [services, setServices] = useState<string[]>(
    (partner?.services ?? []).map((s: unknown) =>
      typeof s === "string" ? s : (s as { name?: string }).name ?? JSON.stringify(s)
    )
  );
  const [serviceInput, setServiceInput] = useState("");
  const [logoUrl, setLogoUrl] = useState(partner?.logo_url ?? "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [photos, setPhotos] = useState<{ url: string; uploading?: boolean }[]>(
    (partner?.photos ?? []).map((url) => ({ url }))
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const toggleCategory = (id: string) =>
    setCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  const toggleEventType = (id: string) =>
    setEventTypes((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  const toggleCity = (city: string) =>
    setCoverCities((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);
  const addService = (s: string) => {
    const t = s.trim();
    if (t && !services.includes(t)) setServices((prev) => [...prev, t]);
    setServiceInput("");
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLogoUploading(true);
    try {
      const url = await uploadFile(file, "partners/logos");
      setLogoUrl(url);
    } catch { setError("Logo yüklenemedi"); }
    finally { setLogoUploading(false); }
  };

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (photoInputRef.current) photoInputRef.current.value = "";
    setPhotoUploading(true);
    for (const file of files) {
      setPhotos((prev) => [...prev, { url: "", uploading: true }]);
      try {
        const url = await uploadFile(file, "partners/photos");
        setPhotos((prev) => { const next = [...prev]; const idx = next.findIndex((p) => p.uploading && p.url === ""); if (idx !== -1) next[idx] = { url }; return next; });
      } catch {
        setPhotos((prev) => { const next = [...prev]; const idx = next.findIndex((p) => p.uploading && p.url === ""); if (idx !== -1) next.splice(idx, 1); return next; });
      }
    }
    setPhotoUploading(false);
  };

  const handleAction = async (fd: FormData) => {
    fd.set("category_json", JSON.stringify(categories));
    fd.set("event_types_json", JSON.stringify(eventTypes));
    fd.set("cover_cities_json", JSON.stringify(coverCities));
    fd.set("services_json", JSON.stringify(services));
    fd.set("logo_url", logoUrl);
    fd.set("photos_json", JSON.stringify(photos.filter((p) => p.url && !p.uploading).map((p) => p.url)));
    setPending(true);
    setError(null);
    try {
      await upsertPartner(fd);
      router.push("/admin/partnerler");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setPending(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";

  return (
    <form action={handleAction} className="space-y-6 max-w-2xl">
      {partner?.id && <input type="hidden" name="id" value={partner.id} />}
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-medium text-foreground">Temel Bilgiler</h2>
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">İşletme Adı</label>
          <input name="business_name" defaultValue={partner?.business_name} required placeholder="İşletme adı" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Açıklama</label>
          <textarea name="description" defaultValue={partner?.description ?? ""} rows={4} placeholder="İşletme hakkında kısa tanıtım…" className={inputCls + " resize-none"} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Şehir (Ana)</label>
            <input name="city" defaultValue={partner?.city ?? ""} placeholder="ör. İstanbul" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Durum</label>
            <select name="application_status" defaultValue={partner?.application_status ?? "approved"} className={inputCls}>
              <option value="approved">Onaylandı</option>
              <option value="pending">Bekliyor</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Aktif</label>
          <select name="is_active" defaultValue={partner?.is_active !== false ? "true" : "false"} className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
            <option value="true">Evet</option>
            <option value="false">Hayır</option>
          </select>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div>
          <h2 className="font-medium text-foreground">Kategoriler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Planlayıcıdaki hizmet listesiyle birebir aynı — birden fazla seçilebilir.</p>
        </div>
        {PARTNER_SERVICE_GROUP_ORDER.map((group) => (
          <div key={group}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {PARTNER_SERVICE_GROUP_META[group].emoji} {group}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PARTNER_SERVICES.filter((s) => s.category === group).map((s) => (
                <button key={s.id} type="button" onClick={() => toggleCategory(s.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${categories.includes(s.id) ? "border-foreground bg-foreground/5 text-foreground font-medium" : "border-border text-muted-foreground hover:border-foreground/40"}`}>
                  {s.label}
                  {categories.includes(s.id) && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Hizmetler</h2>
        {services.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-foreground text-background">
                {s}<button type="button" onClick={() => setServices((prev) => prev.filter((x) => x !== s))} className="opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input value={serviceInput} onChange={(e) => setServiceInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(serviceInput); } }}
            placeholder="Hizmet adı…" className={inputCls} />
          <button type="button" onClick={() => addService(serviceInput)} className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors">Ekle</button>
        </div>
      </div>

      {/* Event types */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Etkinlik Tipleri</h2>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map((et) => (
            <button key={et.id} type="button" onClick={() => toggleEventType(et.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${eventTypes.includes(et.id) ? "border-foreground bg-foreground/5 text-foreground font-medium" : "border-border text-muted-foreground hover:border-foreground/40"}`}>
              {et.label}{eventTypes.includes(et.id) && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Cover cities */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Hizmet Şehirleri</h2>
        {coverCities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {coverCities.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-foreground text-background">
                {c}<button type="button" onClick={() => toggleCity(c)} className="opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input value={cityInput} onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); toggleCity(cityInput.trim()); setCityInput(""); } }}
            placeholder="Şehir ekle…" className={inputCls} />
          <button type="button" onClick={() => { if (cityInput.trim()) { toggleCity(cityInput.trim()); setCityInput(""); } }} className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors">Ekle</button>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Logo</h2>
        {logoUrl ? (
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-xl border border-border bg-secondary/20 overflow-hidden">
              <Image src={logoUrl} alt="Logo" fill className="object-contain p-2" unoptimized />
            </div>
            <button type="button" onClick={() => setLogoUrl("")} className="text-xs text-red-500 hover:text-red-700">Kaldır</button>
          </div>
        ) : (
          <label className="flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-xl px-4 py-3 hover:border-foreground/40 transition-colors">
            <span className="text-xl">🏷️</span>
            <span className="text-sm text-muted-foreground">{logoUploading ? "Yükleniyor…" : "Logo yükle (PNG/SVG)"}</span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleLogo} disabled={logoUploading} />
          </label>
        )}
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h2 className="font-medium text-foreground">Portföy Fotoğrafları</h2>
          <p className="text-xs text-muted-foreground mt-1">İlk fotoğraf kapak olarak kullanılır. "Kapak Yap" ile sırayı değiştirebilirsin.</p>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((ph, i) => (
              <div key={i} className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-secondary/20 ${i === 0 ? "border-foreground" : "border-border"}`}>
                {ph.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <Image src={ph.url} alt="" fill className="object-cover" unoptimized />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-foreground text-background text-[10px] px-2 py-0.5 rounded-full font-medium">Kapak</span>
                    )}
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => { const next = [...prev]; const [item] = next.splice(i, 1); next.unshift(item); return next; })}
                        className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full hover:bg-black/80"
                      >
                        Kapak Yap
                      </button>
                    )}
                    <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80">×</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotos}
          className="block text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-80 cursor-pointer" />
      </div>

      {/* Contact & Links */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">İletişim & Bağlantılar</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Yetkili</label>
            <input name="contact_name" defaultValue={partner?.contact_name ?? ""} placeholder="Ad Soyad" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Telefon</label>
            <input name="phone" type="tel" defaultValue={partner?.phone ?? ""} placeholder="+90 5XX…" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">E-posta</label>
          <input name="email" type="email" defaultValue={partner?.email ?? ""} placeholder="ornek@mail.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Instagram</label>
          <input name="instagram_url" type="url" defaultValue={partner?.instagram_url ?? ""} placeholder="https://instagram.com/…" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Website</label>
          <input name="website_url" type="url" defaultValue={partner?.website_url ?? ""} placeholder="https://…" className={inputCls} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || logoUploading || photoUploading}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? "Kaydediliyor…" : partner?.id ? "Güncelle" : "Partner Ekle"}
        </button>
        <Link href="/admin/partnerler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">İptal</Link>
      </div>
    </form>
  );
}
