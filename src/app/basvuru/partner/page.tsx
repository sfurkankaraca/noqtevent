"use client";

import { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { PARTNER_SERVICES, PARTNER_SERVICE_GROUP_ORDER, PARTNER_SERVICE_GROUP_META } from "@/components/planner/PlannerStore";

const CITIES = ["Kayseri", "Nevşehir", "İstanbul", "İzmir", "Ankara", "Antalya", "Bursa", "Bodrum", "Çeşme", "Muğla"];

const EVENT_TYPES = [
  { id: "wedding", label: "Düğün / Nikah", emoji: "💍" },
  { id: "kina", label: "Kına Gecesi", emoji: "🕯️" },
  { id: "graduation", label: "Mezuniyet", emoji: "🎓" },
  { id: "birthday", label: "Doğum Günü", emoji: "🎂" },
  { id: "bride", label: "Bekarlığa Veda", emoji: "👰" },
  { id: "morning-party", label: "Morning Party", emoji: "☕" },
  { id: "corporate", label: "Kurumsal Etkinlik", emoji: "🏢" },
  { id: "after-party", label: "After Party", emoji: "🌙" },
  { id: "cocktail", label: "Kokteyl / Resepsiyon", emoji: "🥂" },
  { id: "festival", label: "Festival / Açık Hava", emoji: "🎪" },
];

const STEPS = ["Kategori", "Hizmetler", "Medya", "Konum", "İletişim"];

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Yükleme başarısız");
  }
  const { url } = await res.json();
  return url;
}

async function uploadVideoDirect(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<string> {
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
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`Yükleme hatası: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Ağ hatası"));
    xhr.send(file);
  });
  return publicUrl;
}

export default function PartnerBasvuruPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Step 0 — Category
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 1 — Services
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  // Step 2 — Media
  const [logo, setLogo] = useState<{ url: string; uploading?: boolean } | null>(null);
  const [photos, setPhotos] = useState<{ url: string; uploading?: boolean; error?: string }[]>([]);
  const [videos, setVideos] = useState<{ url: string; uploading?: boolean; progress?: number; error?: string }[]>([]);
  const [logoUploading, setLogoUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");

  // Step 3 — Location
  const [coverCities, setCoverCities] = useState<string[]>([]);
  const [customCity, setCustomCity] = useState("");

  // Step 4 — Contact
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralSource, setReferralSource] = useState("");

  const toggleCategory = (id: string) =>
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const toggleEventType = (id: string) =>
    setSelectedEventTypes((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);

  const toggleCity = (city: string) =>
    setCoverCities((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);

  const addService = (s: string) => {
    const t = s.trim();
    if (t && !services.includes(t)) setServices((prev) => [...prev, t]);
    setServiceInput("");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLogoUploading(true);
    setLogo({ url: "", uploading: true });
    try {
      const url = await uploadFile(file, "partners/logos");
      setLogo({ url });
    } catch (err) {
      setLogo(null);
      setError(err instanceof Error ? err.message : "Logo yüklenemedi");
    } finally {
      setLogoUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    setPhotoUploading(true);
    for (const file of files) {
      setPhotos((prev) => [...prev, { url: "", uploading: true }]);
      try {
        const url = await uploadFile(file, "partners/photos");
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
    setPhotoUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    setVideoUploading(true);
    for (const file of files) {
      const idx = videos.length;
      setVideos((prev) => [...prev, { url: "", uploading: true, progress: 0 }]);
      try {
        const url = await uploadVideoDirect(file, "partners/videos", (pct) => {
          setVideos((prev) => {
            const next = [...prev];
            if (next[idx]) next[idx] = { ...next[idx], progress: pct };
            return next;
          });
        });
        setVideos((prev) => {
          const next = [...prev];
          if (next[idx]) next[idx] = { url };
          return next;
        });
      } catch (err) {
        setVideos((prev) => {
          const next = [...prev];
          if (next[idx]) next[idx] = { url: "", error: err instanceof Error ? err.message : "Hata" };
          return next;
        });
      }
    }
    setVideoUploading(false);
  };

  const canProceed = () => {
    if (step === 0) return selectedCategories.length > 0;
    if (step === 1) return businessName.trim().length > 1 && description.trim().length > 10;
    if (step === 2) return true;
    if (step === 3) return coverCities.length > 0;
    if (step === 4) return email.trim().length > 3;
    return false;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("business_name", businessName);
      fd.set("category", JSON.stringify(selectedCategories));
      fd.set("description", description);
      fd.set("services", JSON.stringify(services));
      fd.set("event_types", JSON.stringify(selectedEventTypes));
      fd.set("logo_url", logo?.url ?? "");
      fd.set("photos", JSON.stringify(photos.filter((p) => p.url && !p.error).map((p) => p.url)));
      fd.set("videos_json", JSON.stringify(videos.filter((v) => v.url && !v.error).map((v) => v.url)));
      fd.set("cover_cities", JSON.stringify(coverCities));
      fd.set("city", coverCities[0] ?? "");
      fd.set("instagram_url", instagram);
      fd.set("website_url", website);
      fd.set("contact_name", contactName);
      fd.set("email", email);
      fd.set("phone", phone);
      fd.set("referral_source", referralSource);

      const res = await fetch("/api/basvuru/partner", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Bir hata oluştu.");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors bg-white";

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 bg-[oklch(0.975_0.006_80)] min-h-screen">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-foreground/30" />
              <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">Partner Başvurusu</span>
            </div>
            <h1 className="text-4xl text-foreground leading-tight" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}>
              NOQT ekosisteminе katıl.
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm">
              Hizmetlerini, logonu ve portföyünü paylaş. Onaylandıktan sonra partner olarak yayına girirsin.
            </p>
          </div>

          {success ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <div className="text-5xl mb-4">🤝</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Başvurun Alındı!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ekibimiz başvurunu inceleyecek ve <strong>{email}</strong> adresine dönüş yapacak.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {/* Progress */}
              <div className="flex border-b border-border">
                {STEPS.map((s, i) => (
                  <div key={s} className={`flex-1 py-3 text-center text-[11px] font-medium transition-colors ${i === step ? "bg-foreground text-background" : i < step ? "bg-foreground/10 text-foreground" : "text-muted-foreground"}`}>
                    {i < step ? "✓ " : `${i + 1}. `}{s}
                  </div>
                ))}
              </div>

              <div className="p-8 space-y-6">
                {/* Step 0 — Category */}
                {step === 0 && (
                  <div>
                    <h2 className="font-semibold text-foreground mb-1">Hangi alanda hizmet veriyorsunuz?</h2>
                    <p className="text-sm text-muted-foreground mb-6">Birden fazla seçebilirsiniz. <span className="text-red-500">*</span></p>
                    <div className="space-y-5">
                      {PARTNER_SERVICE_GROUP_ORDER.map((group) => (
                        <div key={group}>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            {PARTNER_SERVICE_GROUP_META[group].emoji} {group}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {PARTNER_SERVICES.filter((s) => s.category === group).map((s) => (
                              <button key={s.id} type="button" onClick={() => toggleCategory(s.id)}
                                className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${selectedCategories.includes(s.id) ? "border-foreground bg-foreground/5 font-medium" : "border-border hover:border-foreground/40"}`}>
                                {s.label}
                                {selectedCategories.includes(s.id) && <span className="ml-auto text-foreground text-xs">✓</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1 — Services & About */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground mb-1">İşletme & Hizmetler</h2>
                      <p className="text-sm text-muted-foreground">Profilinde görünecek bilgiler.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">İşletme Adı <span className="text-red-500">*</span></label>
                      <input className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="ör. Nova Fotoğrafçılık, Bloom Çiçekçilik…" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Hakkında <span className="text-red-500">*</span></label>
                      <textarea className={inputCls + " resize-none"} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="İşletmenizi tanıtın. Deneyim, tarz, uzmanlık alanlarınız…" />
                      <p className="text-xs text-muted-foreground mt-1">{description.length} karakter</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Sunduğunuz Hizmetler</label>
                      <p className="text-xs text-muted-foreground mb-2">Özel hizmetlerinizi ekleyin (ör. "Drone Çekim", "Canlı Yayın", "4K Video").</p>
                      {services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {services.map((s) => (
                            <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-foreground text-background">
                              {s}<button type="button" onClick={() => setServices((prev) => prev.filter((x) => x !== s))} className="opacity-70 hover:opacity-100 ml-0.5">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input className={inputCls} value={serviceInput} onChange={(e) => setServiceInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(serviceInput); } }}
                          placeholder="Hizmet yaz ve Enter'a bas…" />
                        <button type="button" onClick={() => addService(serviceInput)} className="px-4 py-3 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors whitespace-nowrap">Ekle</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-3">Hangi etkinlik türlerine hizmet veriyorsunuz?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {EVENT_TYPES.map((et) => (
                          <button key={et.id} type="button" onClick={() => toggleEventType(et.id)}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${selectedEventTypes.includes(et.id) ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"}`}>
                            <span className="text-lg">{et.emoji}</span>
                            <span className="text-xs font-medium text-foreground">{et.label}</span>
                            {selectedEventTypes.includes(et.id) && <span className="ml-auto text-foreground text-xs">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 — Media */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-semibold text-foreground mb-1">Logo & Portföy Fotoğrafları</h2>
                      <p className="text-sm text-muted-foreground">Logo ve çalışmalarınızdan örnekler ekleyin.</p>
                    </div>

                    {/* Logo */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-3">Logo</label>
                      {logo?.url ? (
                        <div className="flex items-center gap-4 mb-3">
                          <div className="relative w-20 h-20 rounded-xl border border-border bg-secondary/20 overflow-hidden">
                            <Image src={logo.url} alt="Logo" fill className="object-contain p-2" unoptimized />
                          </div>
                          <button type="button" onClick={() => setLogo(null)} className="text-xs text-red-500 hover:text-red-700">Kaldır</button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-xl px-4 py-4 hover:border-foreground/40 transition-colors mb-3">
                          <span className="text-2xl">🏷️</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">Logo Yükle</p>
                            <p className="text-xs text-muted-foreground">{logoUploading ? "Yükleniyor…" : "PNG veya SVG (şeffaf arka plan önerilir)"}</p>
                          </div>
                          <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} disabled={logoUploading} />
                        </label>
                      )}
                    </div>

                    {/* Portfolio photos */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-3">Portföy Fotoğrafları</label>
                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {photos.map((ph, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary/20">
                              {ph.uploading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                                </div>
                              ) : ph.error ? (
                                <div className="w-full h-full flex items-center justify-center p-2"><span className="text-xs text-red-500 text-center">{ph.error}</span></div>
                              ) : (
                                <>
                                  <Image src={ph.url} alt="" fill className="object-cover" unoptimized />
                                  <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                                    className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80">×</button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-xl px-4 py-4 hover:border-foreground/40 transition-colors">
                        <span className="text-2xl">📷</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">Fotoğraf Yükle</p>
                          <p className="text-xs text-muted-foreground">{photoUploading ? "Yükleniyor…" : "Çalışmalarınızdan örnekler — birden fazla seçebilirsiniz"}</p>
                        </div>
                        <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoUpload} disabled={photoUploading} />
                      </label>
                    </div>

                    {/* Videos */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Tanıtım / Showreel Videosu</label>
                      <p className="text-xs text-muted-foreground mb-3">Çalışmalarınızı gösteren video (maks. 500MB)</p>
                      {videos.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {videos.map((v, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
                              {v.uploading ? (
                                <>
                                  <div className="flex-1">
                                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                      <div className="h-full bg-foreground transition-all duration-300 rounded-full" style={{ width: `${v.progress ?? 0}%` }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{v.progress ?? 0}% yükleniyor…</p>
                                  </div>
                                </>
                              ) : v.error ? (
                                <p className="text-xs text-red-500 flex-1">{v.error}</p>
                              ) : (
                                <>
                                  <svg className="text-foreground/40" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                  <span className="text-xs text-foreground flex-1 truncate">Video {i + 1}</span>
                                  <button type="button" onClick={() => setVideos((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-red-400 hover:text-red-600">Kaldır</button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-xl px-4 py-4 hover:border-foreground/40 transition-colors">
                        <span className="text-2xl">🎬</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">Video Yükle</p>
                          <p className="text-xs text-muted-foreground">{videoUploading ? "Yükleniyor…" : "MP4, MOV — maks. 500MB"}</p>
                        </div>
                        <input type="file" accept="video/*" multiple className="sr-only" onChange={handleVideoUpload} disabled={videoUploading} />
                      </label>
                    </div>

                    {/* Social */}
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-foreground">Sosyal Medya & Web</label>
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-1">Instagram</label>
                        <input className={inputCls} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" type="text" />
                      </div>
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-1">Website</label>
                        <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" type="text" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 — Location */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground mb-1">Hizmet Bölgesi</h2>
                      <p className="text-sm text-muted-foreground">En az bir şehir seçin. <span className="text-red-500">*</span></p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CITIES.map((city) => (
                        <button key={city} type="button" onClick={() => toggleCity(city)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${coverCities.includes(city) ? "bg-foreground text-background border-foreground" : "border-border text-foreground hover:border-foreground/40"}`}>
                          {city}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input className={inputCls} value={customCity} onChange={(e) => setCustomCity(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && customCity.trim()) { e.preventDefault(); toggleCity(customCity.trim()); setCustomCity(""); } }}
                        placeholder="Başka şehir ekle…" />
                      <button type="button" onClick={() => { if (customCity.trim()) { toggleCity(customCity.trim()); setCustomCity(""); } }}
                        className="px-4 py-3 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors whitespace-nowrap">Ekle</button>
                    </div>
                    {coverCities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {coverCities.map((c) => (
                          <span key={c} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-foreground text-background">
                            {c}<button type="button" onClick={() => toggleCity(c)} className="opacity-70 hover:opacity-100 ml-0.5">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4 — Contact */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground mb-1">İletişim Bilgileri</h2>
                      <p className="text-sm text-muted-foreground">Başvurunu değerlendirmek için kullanacağız. Profilinizde fiyat bilgisi gösterilmez.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Yetkili Ad Soyad</label>
                      <input className={inputCls} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Adınız Soyadınız" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">E-posta <span className="text-red-500">*</span></label>
                      <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" type="email" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Telefon</label>
                      <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" type="tel" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-2">Bizi nasıl duydun?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Instagram", "TikTok", "Google", "Arkadaş / Tanıdık", "Düğün fuarı / Etkinlik", "Diğer"].map((opt) => (
                          <button key={opt} type="button" onClick={() => setReferralSource(opt)}
                            className={`px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${referralSource === opt ? "border-foreground bg-foreground/5 font-medium" : "border-border text-muted-foreground hover:border-foreground/40"}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[oklch(0.975_0.006_80)] rounded-xl p-4 space-y-2">
                      <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-3">Başvuru Özeti</p>
                      {[
                        ["İşletme", businessName],
                        ["Kategori", `${selectedCategories.length} seçim`],
                        ["Hizmet", `${services.length} adet`],
                        ["Fotoğraf", `${photos.filter((p) => p.url && !p.error).length} adet`],
                        ["Video", `${videos.filter((v) => v.url && !v.error).length} adet`],
                        ["Şehir", coverCities.join(", ")],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="text-foreground font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

                <div className="flex items-center justify-between pt-2">
                  {step > 0 ? (
                    <button type="button" onClick={() => setStep((s) => s - 1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Geri</button>
                  ) : <div />}
                  {step < STEPS.length - 1 ? (
                    <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
                      className="bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                      Devam Et →
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit} disabled={loading || !canProceed() || photoUploading || logoUploading || videoUploading}
                      className="bg-foreground text-background px-8 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                      {loading ? "Gönderiliyor…" : "Başvuruyu Gönder"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
