"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upsertInvitation } from "./actions";

type Table = { name: string; capacity: number; guests: string[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function InvitationForm({ invitation }: { invitation?: Record<string, any> }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cover photo
  const [coverUrl, setCoverUrl] = useState<string>(invitation?.cover_photo_url ?? "");
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Seating plan image
  const [seatingUrl, setSeatingUrl] = useState<string>(invitation?.seating_plan_url ?? "");
  const [seatingProgress, setSeatingProgress] = useState<number | null>(null);
  const [seatingError, setSeatingError] = useState<string | null>(null);
  const seatingRef = useRef<HTMLInputElement>(null);

  // Seating tables
  const [tables, setTables] = useState<Table[]>(
    Array.isArray(invitation?.seating_tables) ? invitation.seating_tables : []
  );

  // Memory Drive — mevcut değeri koru, alternatif olarak var olan bir etkinliğe bağla
  const [memorySlugInput, setMemorySlugInput] = useState("");

  // Bazı tarayıcılar HEIC/HEIF (iPhone fotoğrafları) için file.type'ı boş bırakır
  const EXT_MIME: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    gif: "image/gif", avif: "image/avif", heic: "image/heic", heif: "image/heif",
  };
  function mimeFor(file: File): string {
    if (file.type) return file.type;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    return EXT_MIME[ext] ?? "";
  }

  // Dosya tarayıcıdan doğrudan Supabase Storage'a yüklenir (imzalı URL).
  // Sunucu üzerinden geçirmek (eski /api/upload) Vercel'in ~4.5MB fonksiyon
  // body limitine takılıyordu — büyük PNG/JPEG'ler sessizce 413 ile reddediliyordu.
  async function uploadFile(
    file: File,
    folder: string,
    setUrl: (u: string) => void,
    setProgress: (p: number | null) => void,
    setError: (e: string | null) => void
  ) {
    setError(null);
    setProgress(0);
    try {
      const contentType = mimeFor(file);
      const presignRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, filename: file.name, contentType, size: file.size }),
      });
      const presign = await presignRes.json();
      if (!presignRes.ok || !presign.signedUrl) {
        throw new Error(presign.error || "Yükleme başlatılamadı.");
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presign.signedUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Yükleme hatası (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Bağlantı hatası — tekrar deneyin."));
        xhr.send(file);
      });

      setUrl(presign.publicUrl);
      if (contentType === "image/heic" || contentType === "image/heif") {
        setError("Yüklendi, ancak bu HEIC (iPhone) formatı bazı tarayıcılarda önizlenemeyebilir. Sorun yaşarsanız JPEG/PNG olarak tekrar yükleyin.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız oldu.");
    } finally {
      setProgress(null);
    }
  }

  function addTable() {
    setTables((t) => [...t, { name: `Masa ${t.length + 1}`, capacity: 10, guests: [] }]);
  }

  function updateTable(i: number, field: keyof Table, value: string | number | string[]) {
    setTables((t) => t.map((tbl, idx) => idx === i ? { ...tbl, [field]: value } : tbl));
  }

  function updateGuests(i: number, raw: string) {
    const guests = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    updateTable(i, "guests", guests);
  }

  function removeTable(i: number) {
    setTables((t) => t.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("cover_photo_url", coverUrl);
    fd.set("seating_plan_url", seatingUrl);
    fd.set("seating_tables", JSON.stringify(tables));
    fd.set("existing_memory_drive_url", invitation?.memory_drive_url ?? "");
    if (memorySlugInput.trim()) fd.set("memory_drive_manual", memorySlugInput.trim());

    setPending(true);
    try {
      await upsertInvitation(fd);
      router.push("/admin/davetiyeler");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Bir hata oluştu");
      setPending(false);
    }
  }

  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";
  const lbl = "block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {invitation?.id && <input type="hidden" name="id" value={invitation.id} />}

      {formError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>
      )}

      {/* Temel */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Temel Bilgiler</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>URL (slug)</label>
            <input name="slug" required defaultValue={invitation?.slug ?? ""} placeholder="ayse-ali" className={inp} />
            <p className="text-xs text-muted-foreground mt-1">noqt.events/davetiye/ayse-ali</p>
          </div>
          <div>
            <label className={lbl}>Şablon</label>
            <select name="template" defaultValue={invitation?.template ?? "modern"} className={inp}>
              <option value="modern">Modern (Koyu)</option>
              <option value="classic">Classic (Açık, İtalik)</option>
              <option value="minimal">Minimal (Beyaz, Grid)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Gelin Adı</label>
            <input name="bride_name" required defaultValue={invitation?.bride_name ?? ""} placeholder="Ayşe" className={inp} />
          </div>
          <div>
            <label className={lbl}>Damat Adı</label>
            <input name="groom_name" required defaultValue={invitation?.groom_name ?? ""} placeholder="Ali" className={inp} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Tarih</label>
            <input type="date" name="wedding_date" defaultValue={invitation?.wedding_date ?? ""} className={inp} />
          </div>
          <div>
            <label className={lbl}>Saat</label>
            <input type="time" name="wedding_time" defaultValue={invitation?.wedding_time ?? ""} className={inp} />
          </div>
        </div>
      </div>

      {/* Kapak fotoğrafı */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Kapak Fotoğrafı</h2>
        <div
          className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-foreground/30 transition-colors"
          onClick={() => coverRef.current?.click()}
        >
          {coverUrl ? (
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
              <Image src={coverUrl} alt="Kapak" fill className="object-cover" />
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-xl">+</div>
              <p className="text-sm text-muted-foreground">Fotoğraf yükle</p>
              <p className="text-xs text-muted-foreground/60">JPG, PNG, WEBP · Maks 15MB</p>
            </>
          )}
          {coverProgress !== null && (
            <div className="w-full max-w-xs space-y-1">
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div className="bg-foreground h-1.5 rounded-full transition-all duration-200" style={{ width: `${coverProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">Yükleniyor… %{coverProgress}</p>
            </div>
          )}
        </div>
        {coverError && (
          <p className={`text-xs ${coverUrl ? "text-amber-600" : "text-red-600"}`}>{coverError}</p>
        )}
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f, "invitations/covers", setCoverUrl, setCoverProgress, setCoverError);
          }}
        />
        {coverUrl && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors"
            >
              Değiştir
            </button>
            <button
              type="button"
              onClick={() => setCoverUrl("")}
              className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
            >
              Kaldır
            </button>
          </div>
        )}
      </div>

      {/* Mekan */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Mekan</h2>
        <div>
          <label className={lbl}>Mekan Adı</label>
          <input name="venue_name" defaultValue={invitation?.venue_name ?? ""} placeholder="Grand Hotel Ballroom" className={inp} />
        </div>
        <div>
          <label className={lbl}>Adres</label>
          <input name="venue_address" defaultValue={invitation?.venue_address ?? ""} placeholder="Cadde, İlçe, Şehir" className={inp} />
        </div>
        <div>
          <label className={lbl}>Google Maps URL</label>
          <input type="url" name="venue_maps_url" defaultValue={invitation?.venue_maps_url ?? ""} placeholder="https://maps.google.com/…" className={inp} />
        </div>
      </div>

      {/* Oturma Planı */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Oturma & Masa Planı</h2>
          <button
            type="button"
            onClick={addTable}
            className="text-xs bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            + Masa Ekle
          </button>
        </div>

        {/* Yerleşim görseli */}
        <div>
          <label className={lbl}>Salon / Masa Düzeni Görseli</label>
          <div
            className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-foreground/30 transition-colors"
            onClick={() => seatingRef.current?.click()}
          >
            {seatingUrl ? (
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                <Image src={seatingUrl} alt="Oturma planı" fill className="object-cover" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Salon planı / masa düzeni görseli yükle</p>
                <p className="text-xs text-muted-foreground/60">Misafirler davetiyede görebilir</p>
              </>
            )}
            {seatingProgress !== null && (
              <div className="w-full max-w-xs space-y-1">
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div className="bg-foreground h-1.5 rounded-full transition-all duration-200" style={{ width: `${seatingProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground text-center">Yükleniyor… %{seatingProgress}</p>
              </div>
            )}
          </div>
          {seatingError && (
            <p className={`text-xs mt-1 ${seatingUrl ? "text-amber-600" : "text-red-600"}`}>{seatingError}</p>
          )}
          <input
            ref={seatingRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f, "invitations/seating", setSeatingUrl, setSeatingProgress, setSeatingError);
            }}
          />
          {seatingUrl && (
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => seatingRef.current?.click()} className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors">Değiştir</button>
              <button type="button" onClick={() => setSeatingUrl("")} className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors">Kaldır</button>
            </div>
          )}
        </div>

        {/* Masa listesi */}
        {tables.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Masalar</p>
            {tables.map((tbl, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    value={tbl.name}
                    onChange={(e) => updateTable(i, "name", e.target.value)}
                    placeholder="Masa adı"
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-foreground/40"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">Kapasite</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={tbl.capacity}
                      onChange={(e) => updateTable(i, "capacity", Number(e.target.value))}
                      className="w-16 px-2 py-2 rounded-lg border border-border text-sm text-center focus:outline-none focus:border-foreground/40"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTable(i)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Misafirler (her satıra bir isim)</label>
                  <textarea
                    rows={Math.max(3, tbl.guests.length + 1)}
                    value={tbl.guests.join("\n")}
                    onChange={(e) => updateGuests(i, e.target.value)}
                    placeholder={"Ayşe Yılmaz\nAli Kaya\n…"}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-foreground/40 font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {tbl.guests.length}/{tbl.capacity} kişi
                    {tbl.guests.length > tbl.capacity && (
                      <span className="text-amber-500 ml-2">⚠ Kapasite aşıldı</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tables.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Henüz masa eklenmedi. "Masa Ekle" ile başlayın.
          </p>
        )}
      </div>

      {/* Memory Drive */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Memory Drive</h2>
        {invitation?.memory_drive_url ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Memory Drive aktif
            </div>
            <div className="bg-secondary rounded-xl px-4 py-3 text-xs font-mono text-foreground break-all">
              {invitation.memory_drive_url}
            </div>
            <p className="text-xs text-muted-foreground">Misafirler bu linke fotoğraf/video yükleyebilir. Galeri Admin → Memory Drive bölümünde görünür.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="create_memory_drive" className="w-4 h-4 rounded mt-0.5" disabled={!!memorySlugInput.trim()} />
              <div>
                <span className="text-sm text-foreground">Yeni Memory Drive oluştur</span>
                <p className="text-xs text-muted-foreground mt-0.5">Misafirlerin fotoğraf ve video yükleyebileceği özel bir klasör otomatik oluşturulur.</p>
              </div>
            </label>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">veya</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div>
              <label className={lbl}>Mevcut bir Memory Drive’a bağla</label>
              <input
                value={memorySlugInput}
                onChange={(e) => setMemorySlugInput(e.target.value)}
                placeholder="noqt.events/memory/ayse-ali veya ayse-ali"
                className={inp}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Admin → Memory Drive panelinde daha önce oluşturduysanız, URL’sini veya slug’ını buraya yapıştırın.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* İçerik */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">İçerik</h2>
        <div>
          <label className={lbl}>Hikaye</label>
          <textarea name="story" rows={4} defaultValue={invitation?.story ?? ""} placeholder="Nasıl tanıştınız?" className={inp + " resize-none"} />
        </div>
        <div>
          <label className={lbl}>Kıyafet Kodu</label>
          <input name="dress_code" defaultValue={invitation?.dress_code ?? ""} placeholder="Smart Casual" className={inp} />
        </div>
        <div>
          <label className={lbl}>Müzik Notu</label>
          <input name="music_note" defaultValue={invitation?.music_note ?? ""} placeholder="Özel şarkı ya da playlist notu" className={inp} />
        </div>
      </div>

      {/* RSVP */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">RSVP</h2>
        <div>
          <label className={lbl}>Son Yanıt Tarihi</label>
          <input type="date" name="rsvp_deadline" defaultValue={invitation?.rsvp_deadline ?? ""} className={inp} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="rsvp_enabled" defaultChecked={invitation?.rsvp_enabled ?? true} className="w-4 h-4 rounded" />
          <span className="text-sm text-foreground">RSVP formu aktif</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_active" defaultChecked={invitation?.is_active ?? true} className="w-4 h-4 rounded" />
          <span className="text-sm text-foreground">Davetiye yayında</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
