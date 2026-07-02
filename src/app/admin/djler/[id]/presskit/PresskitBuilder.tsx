"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import RiderBuilder, { normalizeRiderItems, type RiderItem } from "@/components/admin/RiderBuilder";
import { savePresskitAction } from "./actions";

const PERFORMER_LABELS: Record<string, string> = {
  dj: "DJ", artist: "Solo Sanatçı", trio: "Trio / Grup",
  dance: "Dans Ekibi", band: "Bando / Orkestra",
  host: "Sunucu / MC", moderator: "Moderatör",
};

type Photo = { url: string; focal_points?: Record<string, { x: number; y: number }> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PresskitBuilder({ dj }: { dj: Record<string, any> }) {
  const photos: string[] = Array.isArray(dj.photos) && dj.photos.length > 0
    ? dj.photos : dj.photo_url ? [dj.photo_url] : [];
  const focalPoints: Record<string, { x: number; y: number }> = dj.focal_points ?? {};

  const toSlug = (s: string) =>
    s.toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const [slug, setSlug] = useState<string>(dj.slug ?? "");
  const [bio, setBio] = useState<string>(dj.bio ?? "");
  const [speciality, setSpeciality] = useState<string>(dj.speciality ?? "");
  const [repertoire, setRepertoire] = useState<string>(dj.repertoire ?? "");
  const [email, setEmail] = useState<string>(dj.email ?? "");
  const [phone, setPhone] = useState<string>(dj.phone ?? "");
  const [instagram, setInstagram] = useState<string>(dj.instagram_url ?? "");
  const [spotify, setSpotify] = useState<string>(dj.spotify_url ?? "");
  const [soundcloud, setSoundcloud] = useState<string>(dj.soundcloud_url ?? "");
  const [mixcloud, setMixcloud] = useState<string>(dj.mixcloud_url ?? "");
  const [youtube, setYoutube] = useState<string>(dj.youtube_url ?? "");
  const [website, setWebsite] = useState<string>(dj.website_url ?? "");
  const [riderItems, setRiderItems] = useState<RiderItem[]>(
    Array.isArray(dj.rider) ? normalizeRiderItems(dj.rider) : []
  );
  const [riderUrl, setRiderUrl] = useState<string>(dj.rider_url ?? "");
  const [mediaDriveUrl, setMediaDriveUrl] = useState<string>(dj.media_drive_url ?? "");
  const [photoOrder, setPhotoOrder] = useState<string[]>(photos);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const presskitUrl = slug ? `/s/${slug}` : null;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.noqt.events";

  const copyLink = () => {
    if (!presskitUrl) return;
    navigator.clipboard.writeText(`${origin}${presskitUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reloadPreview = () => {
    if (iframeRef.current && presskitUrl) {
      iframeRef.current.src = presskitUrl + "?t=" + Date.now();
    }
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await savePresskitAction({
          id: dj.id,
          slug: slug || null,
          bio: bio || null,
          speciality: speciality || null,
          repertoire: repertoire || null,
          email: email || null,
          phone: phone || null,
          instagram_url: instagram || null,
          spotify_url: spotify || null,
          soundcloud_url: soundcloud || null,
          mixcloud_url: mixcloud || null,
          youtube_url: youtube || null,
          website_url: website || null,
          rider: riderItems,
          rider_url: riderUrl || null,
          media_drive_url: mediaDriveUrl || null,
          photos: photoOrder,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setTimeout(reloadPreview, 300);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kayıt başarısız");
      }
    });
  };

  const movePhoto = (idx: number, dir: -1 | 1) => {
    const next = [...photoOrder];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setPhotoOrder(next);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";
  const labelCls = "block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2";
  const sectionCls = "space-y-4 border-b border-border pb-6";

  return (
    <div className="flex gap-6 items-start" style={{ minHeight: "calc(100vh - 160px)" }}>
      {/* ── Sol: Form ── */}
      <div className="w-[420px] flex-shrink-0 space-y-6 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 160px)" }}>

        {/* Slug + Aksiyon butonları */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Presskit Linki</h2>
            {slug && (
              <a href={presskitUrl!} target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Sayfayı Aç ↗
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">/s/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="sanatci-adi"
                className={`${inputCls} pl-8 font-mono`}
              />
            </div>
            <button type="button"
              onClick={() => setSlug(toSlug(dj.name ?? ""))}
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

        {/* Kimlik */}
        <div className={`bg-white rounded-2xl border border-border p-5 ${sectionCls}`} style={{ borderBottom: "none" }}>
          <h2 className="font-semibold text-foreground mb-4">Kimlik</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>İsim</label>
              <p className="text-sm text-foreground px-3 py-2.5 rounded-xl bg-secondary/30">
                {dj.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({PERFORMER_LABELS[dj.performer_type] ?? dj.performer_type}
                  {dj.city ? ` · ${dj.city}` : ""})
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                İsim ve şehir değiştirmek için <a href={`/admin/djler/${dj.id}/edit`} className="underline">profil düzenle</a>.
              </p>
            </div>
            <div>
              <label className={labelCls}>Uzmanlık / Tagline</label>
              <input value={speciality} onChange={(e) => setSpeciality(e.target.value)}
                placeholder="ör. Deep House, Düğün DJ'i, 15 yıllık sahne deneyimi"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Biyografi</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                rows={5} placeholder="Kısa ve etkileyici bir tanıtım…"
                className={`${inputCls} resize-none`} />
              <p className="text-xs text-muted-foreground mt-1">{bio.length} karakter</p>
            </div>
            <div>
              <label className={labelCls}>Repertuar</label>
              <textarea value={repertoire} onChange={(e) => setRepertoire(e.target.value)}
                rows={3} placeholder="Türkçe pop, latin, caz standartları…"
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {/* Fotoğraf Sırası */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Fotoğraf Sırası</h2>
            <p className="text-xs text-muted-foreground mt-0.5">İlk fotoğraf kapak olarak kullanılır.</p>
          </div>
          {photoOrder.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Fotoğraf yok —{" "}
              <a href={`/admin/djler/${dj.id}/edit`} className="underline">profil düzenleme</a> sayfasından yükle.
            </p>
          ) : (
            <div className="space-y-2">
              {photoOrder.map((url, i) => (
                <div key={url} className="flex items-center gap-3 p-2 rounded-xl border border-border bg-secondary/10">
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                    <Image src={url} alt="" fill className="object-cover" unoptimized
                      style={{ objectPosition: `${focalPoints[url]?.x ?? 50}% ${focalPoints[url]?.y ?? 50}%` }} />
                  </div>
                  <span className="flex-1 text-xs text-muted-foreground truncate">
                    {i === 0 && <span className="mr-1.5 text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded-full">Kapak</span>}
                    Fotoğraf {i + 1}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <button type="button" disabled={i === 0} onClick={() => movePhoto(i, -1)}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button type="button" disabled={i === photoOrder.length - 1} onClick={() => movePhoto(i, 1)}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teknik Rider */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Teknik Rider</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              "Organizatör sağlar" → müşteriye &quot;Bunu biz ayarlayalım mı?&quot; olarak yansır.
            </p>
          </div>
          <RiderBuilder value={riderItems} onChange={setRiderItems} />

          {/* Rider PDF */}
          <div>
            <label className={labelCls}>Rider PDF (opsiyonel)</label>
            {riderUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground flex-shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <a href={riderUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-foreground hover:underline flex-1 truncate">
                  {decodeURIComponent(riderUrl.split("/").pop() ?? "rider.pdf")}
                </a>
                <button type="button" onClick={() => setRiderUrl("")}
                  className="text-xs text-red-500 hover:text-red-700">Kaldır</button>
              </div>
            ) : (
              <label className="flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-xl px-4 py-3 hover:border-foreground/40 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="text-sm text-muted-foreground">PDF Yükle</span>
                <input type="file" accept="application/pdf" className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    e.target.value = "";
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("folder", "artists/riders");
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    if (res.ok) { const { url } = await res.json(); setRiderUrl(url); }
                  }} />
              </label>
            )}
          </div>

          {/* Foto & Video Drive Linki */}
          <div>
            <label className={labelCls}>Fotoğraf & Video Drive Linki</label>
            <p className="text-xs text-muted-foreground mb-2">
              Booking sonrası organizasyon şirketinin yüksek çözünürlüklü materyal indirebileceği Google Drive / WeTransfer klasör linki.
            </p>
            <input
              value={mediaDriveUrl}
              onChange={(e) => setMediaDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/…"
              type="url"
              className={inputCls}
            />
          </div>
        </div>

        {/* Bağlantılar */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Bağlantılar</h2>
          {[
            { label: "Instagram", value: instagram, set: setInstagram, placeholder: "https://instagram.com/…" },
            { label: "Spotify", value: spotify, set: setSpotify, placeholder: "https://open.spotify.com/…" },
            { label: "SoundCloud", value: soundcloud, set: setSoundcloud, placeholder: "https://soundcloud.com/…" },
            { label: "Mixcloud", value: mixcloud, set: setMixcloud, placeholder: "https://mixcloud.com/…" },
            { label: "YouTube", value: youtube, set: setYoutube, placeholder: "https://youtube.com/…" },
            { label: "Website", value: website, set: setWebsite, placeholder: "https://…" },
          ].map((f) => (
            <div key={f.label}>
              <label className={labelCls}>{f.label}</label>
              <input value={f.value} onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder} type="url" className={inputCls} />
            </div>
          ))}
        </div>

        {/* İletişim */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">İletişim</h2>
          <div>
            <label className={labelCls}>E-posta</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="iletisim@…" type="email" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Telefon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5XX…" type="tel" className={inputCls} />
          </div>
        </div>

        {/* Kaydet */}
        <div className="pb-6">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">{error}</p>
          )}
          <button type="button" onClick={handleSave} disabled={isPending}
            className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? "Kaydediliyor…" : saved ? "✓ Kaydedildi" : "Presskit'i Kaydet"}
          </button>
        </div>
      </div>

      {/* ── Sağ: Önizleme ── */}
      <div className="flex-1 flex flex-col" style={{ minHeight: "calc(100vh - 160px)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Önizleme</span>
          {presskitUrl ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">noqt.events/s/{slug}</span>
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
          {presskitUrl ? (
            <iframe
              ref={iframeRef}
              src={presskitUrl}
              className="w-full h-full"
              style={{ minHeight: "calc(100vh - 220px)" }}
              title="Presskit Önizleme"
            />
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
