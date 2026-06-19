"use client";

import { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

const PERFORMER_TYPES = [
  { id: "dj", label: "DJ", emoji: "🎧", desc: "Elektronik müzik, set performansı" },
  { id: "artist", label: "Solo Sanatçı", emoji: "🎤", desc: "Şarkıcı, enstrümantalist" },
  { id: "trio", label: "Trio / Grup", emoji: "🎶", desc: "Küçük müzik grubu" },
  { id: "dance", label: "Dans Ekibi", emoji: "💃", desc: "Gösteri, dans performansı" },
  { id: "band", label: "Bando / Orkestra", emoji: "🎺", desc: "Büyük müzik topluluğu" },
];

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

const CITIES = ["İstanbul", "İzmir", "Ankara", "Antalya", "Bursa", "Bodrum", "Çeşme", "Muğla"];

const STEPS = ["Tür", "Hakkında", "Etkinlikler", "Medya", "İletişim"];

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "performers");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Yükleme başarısız");
  }
  const { url } = await res.json();
  return url;
}

export default function BasvuruPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Step 0 — Type
  const [performerType, setPerformerType] = useState("");

  // Step 1 — About
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [repertoire, setRepertoire] = useState("");
  const [coverCities, setCoverCities] = useState<string[]>([]);
  const [customCity, setCustomCity] = useState("");

  // Step 2 — Event types
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  // Step 3 — Media
  const [photos, setPhotos] = useState<{ url: string; uploading?: boolean; error?: string }[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>(["", "", ""]);
  const [instagram, setInstagram] = useState("");
  const [spotify, setSpotify] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [website, setWebsite] = useState("");

  // Step 4 — Contact
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const toggleCity = (city: string) => {
    setCoverCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleEventType = (id: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    setPhotoUploading(true);

    for (const file of files) {
      const placeholder = { url: "", uploading: true };
      setPhotos((prev) => [...prev, placeholder]);
      try {
        const url = await uploadFile(file);
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

  const canProceed = () => {
    if (step === 0) return !!performerType;
    if (step === 1) return name.trim().length > 1 && bio.trim().length > 10;
    if (step === 2) return selectedEventTypes.length > 0;
    if (step === 3) return true;
    if (step === 4) return email.trim().length > 3;
    return false;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("performer_type", performerType);
      fd.set("name", name);
      fd.set("bio", bio);
      fd.set("speciality", speciality);
      fd.set("repertoire", repertoire);
      fd.set("cover_cities", JSON.stringify(coverCities));
      fd.set("event_types", JSON.stringify(selectedEventTypes));
      fd.set("photos", JSON.stringify(photos.filter((p) => p.url && !p.error).map((p) => p.url)));
      fd.set("youtube_links", JSON.stringify(youtubeLinks.filter(Boolean)));
      fd.set("instagram_url", instagram);
      fd.set("spotify_url", spotify);
      fd.set("soundcloud_url", soundcloud);
      fd.set("website_url", website);
      fd.set("contact_name", contactName);
      fd.set("email", email);
      fd.set("phone", phone);

      const res = await fetch("/api/basvuru", { method: "POST", body: fd });
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
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-foreground/30" />
              <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
                Sanatçı / Partner Başvurusu
              </span>
            </div>
            <h1
              className="text-4xl text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              NOQT ile sahne al.
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm">
              Başvurunu tamamla, ekibimiz incelesin. Onaylandıktan sonra profilin otomatik olarak yayınlanır.
            </p>
          </div>

          {success ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Başvurun Alındı!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ekibimiz başvurunu inceleyecek ve <strong>{email}</strong> adresine dönüş yapacak.
                Onaylandıktan sonra profilin NOQT&apos;ta yayınlanacak.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {/* Progress bar */}
              <div className="flex border-b border-border">
                {STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`flex-1 py-3 text-center text-[11px] font-medium transition-colors ${
                      i === step
                        ? "bg-foreground text-background"
                        : i < step
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {i < step ? "✓ " : `${i + 1}. `}{s}
                  </div>
                ))}
              </div>

              <div className="p-8 space-y-6">
                {/* Step 0: Performer type */}
                {step === 0 && (
                  <div>
                    <h2 className="font-semibold text-foreground mb-1">Sen kimsin?</h2>
                    <p className="text-sm text-muted-foreground mb-6">Sanatçı veya ekip türünü seç.</p>
                    <div className="space-y-3">
                      {PERFORMER_TYPES.map((pt) => (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setPerformerType(pt.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                            performerType === pt.id
                              ? "border-foreground bg-foreground/5"
                              : "border-border hover:border-foreground/40"
                          }`}
                        >
                          <span className="text-2xl">{pt.emoji}</span>
                          <div>
                            <div className="text-sm font-medium text-foreground">{pt.label}</div>
                            <div className="text-xs text-muted-foreground">{pt.desc}</div>
                          </div>
                          {performerType === pt.id && (
                            <span className="ml-auto text-foreground">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1: About */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground mb-1">Kendini tanıt</h2>
                      <p className="text-sm text-muted-foreground">Bu bilgiler profilinde görünecek.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Sahne Adı / Ekip Adı <span className="text-red-500">*</span>
                      </label>
                      <input
                        className={inputCls}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="DJ Nova, Ece Güler, The Jazz Trio…"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Uzmanlık / Müzik Stili
                      </label>
                      <input
                        className={inputCls}
                        value={speciality}
                        onChange={(e) => setSpeciality(e.target.value)}
                        placeholder="Deep House, Latin Dans, Caz, Türkçe Pop…"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Hakkında <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className={inputCls + " resize-none"}
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Kendinizi tanıtın. Deneyimleriniz, tarzınız, neyi farklı kıldığınız…"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{bio.length} karakter</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Repertuar
                      </label>
                      <textarea
                        className={inputCls + " resize-none"}
                        rows={3}
                        value={repertoire}
                        onChange={(e) => setRepertoire(e.target.value)}
                        placeholder="Hangi dillerde / türlerde çalıyorsunuz? ör. Türkçe pop, Arapça, Flamenko, 90s hits, canlı caz standartları…"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-3">
                        Hizmet Verdiğiniz Şehirler
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {CITIES.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => toggleCity(city)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              coverCities.includes(city)
                                ? "bg-foreground text-background border-foreground"
                                : "border-border text-foreground hover:border-foreground/40"
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          className={inputCls}
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && customCity.trim()) {
                              e.preventDefault();
                              toggleCity(customCity.trim());
                              setCustomCity("");
                            }
                          }}
                          placeholder="Başka şehir ekle…"
                        />
                        <button
                          type="button"
                          onClick={() => { if (customCity.trim()) { toggleCity(customCity.trim()); setCustomCity(""); } }}
                          className="px-4 py-3 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
                        >
                          Ekle
                        </button>
                      </div>
                      {coverCities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {coverCities.map((c) => (
                            <span key={c} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-foreground text-background">
                              {c}
                              <button type="button" onClick={() => toggleCity(c)} className="opacity-70 hover:opacity-100 ml-0.5">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Event types */}
                {step === 2 && (
                  <div>
                    <h2 className="font-semibold text-foreground mb-1">Hangi etkinliklerde sahne alırsınız?</h2>
                    <p className="text-sm text-muted-foreground mb-6">Birden fazla seçebilirsiniz. <span className="text-red-500">*</span></p>
                    <div className="grid grid-cols-2 gap-3">
                      {EVENT_TYPES.map((et) => (
                        <button
                          key={et.id}
                          type="button"
                          onClick={() => toggleEventType(et.id)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                            selectedEventTypes.includes(et.id)
                              ? "border-foreground bg-foreground/5"
                              : "border-border hover:border-foreground/40"
                          }`}
                        >
                          <span className="text-xl">{et.emoji}</span>
                          <span className="text-xs font-medium text-foreground leading-tight">{et.label}</span>
                          {selectedEventTypes.includes(et.id) && (
                            <span className="ml-auto text-foreground text-xs">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Media */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-semibold text-foreground mb-1">Fotoğraf & Video</h2>
                      <p className="text-sm text-muted-foreground">İlk fotoğraf profil kapağı olarak kullanılır.</p>
                    </div>

                    {/* Photos */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-3">Fotoğraflar</label>
                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {photos.map((ph, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary/20">
                              {ph.uploading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                                </div>
                              ) : ph.error ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                  <span className="text-xs text-red-500">{ph.error}</span>
                                </div>
                              ) : (
                                <>
                                  <Image src={ph.url} alt="" fill className="object-cover" unoptimized />
                                  {i === 0 && (
                                    <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">Kapak</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                                    className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80"
                                  >
                                    ×
                                  </button>
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
                          <p className="text-xs text-muted-foreground">{photoUploading ? "Yükleniyor…" : "JPG, PNG — birden fazla seçebilirsiniz"}</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={handlePhotoUpload}
                          disabled={photoUploading}
                        />
                      </label>
                    </div>

                    {/* YouTube links */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Performans Videoları (YouTube)
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Canlı performans, mix veya gösteri videolarınızın linklerini ekleyin.
                      </p>
                      <div className="space-y-2">
                        {youtubeLinks.map((link, i) => (
                          <input
                            key={i}
                            className={inputCls}
                            value={link}
                            onChange={(e) => {
                              const next = [...youtubeLinks];
                              next[i] = e.target.value;
                              setYoutubeLinks(next);
                            }}
                            placeholder={`YouTube video linki ${i + 1}`}
                            type="url"
                          />
                        ))}
                        {youtubeLinks.length < 6 && (
                          <button
                            type="button"
                            onClick={() => setYoutubeLinks((prev) => [...prev, ""])}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            + Başka video ekle
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Social links */}
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-foreground">Sosyal Medya & Müzik Platformları</label>
                      {[
                        { label: "Instagram", value: instagram, set: setInstagram, placeholder: "https://instagram.com/…" },
                        { label: "Spotify", value: spotify, set: setSpotify, placeholder: "https://open.spotify.com/…" },
                        { label: "SoundCloud / Mixcloud", value: soundcloud, set: setSoundcloud, placeholder: "https://soundcloud.com/…" },
                        { label: "Website", value: website, set: setWebsite, placeholder: "https://…" },
                      ].map((f) => (
                        <div key={f.label}>
                          <label className="block text-[11px] text-muted-foreground mb-1">{f.label}</label>
                          <input
                            className={inputCls}
                            value={f.value}
                            onChange={(e) => f.set(e.target.value)}
                            placeholder={f.placeholder}
                            type="url"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Contact */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-semibold text-foreground mb-1">İletişim Bilgileri</h2>
                      <p className="text-sm text-muted-foreground">Başvurunu değerlendirmek ve onay sonrası sizi haberdar etmek için kullanacağız.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Yetkili Ad Soyad</label>
                      <input
                        className={inputCls}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Adınız Soyadınız"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        E-posta <span className="text-red-500">*</span>
                      </label>
                      <input
                        className={inputCls}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ornek@mail.com"
                        type="email"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Telefon</label>
                      <input
                        className={inputCls}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+90 5XX XXX XX XX"
                        type="tel"
                      />
                    </div>

                    {/* Summary */}
                    <div className="bg-[oklch(0.975_0.006_80)] rounded-xl p-4 space-y-2 text-sm">
                      <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-3">Başvuru Özeti</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Tür</span>
                        <span className="text-foreground font-medium">
                          {PERFORMER_TYPES.find((p) => p.id === performerType)?.emoji} {PERFORMER_TYPES.find((p) => p.id === performerType)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Sahne Adı</span>
                        <span className="text-foreground font-medium">{name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Fotoğraf</span>
                        <span className="text-foreground font-medium">{photos.filter((p) => p.url && !p.error).length} adet</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Etkinlik Tipleri</span>
                        <span className="text-foreground font-medium">{selectedEventTypes.length} seçim</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Video</span>
                        <span className="text-foreground font-medium">{youtubeLinks.filter(Boolean).length} link</span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Geri
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s + 1)}
                      disabled={!canProceed()}
                      className="bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Devam Et →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading || !canProceed() || photoUploading}
                      className="bg-foreground text-background px-8 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
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
