"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertBooking, type BookingPayload, type BookingItemPayload } from "./actions";
import type { BookingItem } from "@/lib/bookingItems";

const EVENT_TYPE_LABELS = [
  "Düğün", "Düğün / Nikah", "Nişan", "Kına Gecesi", "Doğum Günü",
  "Kurumsal Etkinlik", "Marka Lansmanı", "Açılış Etkinliği",
  "Özel Parti", "After Party", "Morning Party", "Bekarlığa Veda",
  "Bride / Bekarlığa Veda", "Mezuniyet", "Kokteyl / Resepsiyon",
  "Festival", "Kulüp / Bar Gecesi",
];

type Artist = { id: string; name: string; performer_type: string | null };
type Inquiry = { id: string; name: string; event_type: string | null; event_date: string | null; email: string | null; phone: string | null };

type Props = {
  artists: Artist[];
  inquiries?: Inquiry[];
  booking?: Partial<BookingPayload> & { id?: string };
  items?: BookingItem[];
};

// Teklif kalemi taslağı (form state) — kaydederken BookingItemPayload'a çevrilir
type ItemDraft = {
  key: number;
  kind: "artist" | "service";
  artist_id: string;
  title: string;
  description: string;
  amount: string;
};

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";
const labelCls = "block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2";

export default function BookingForm({ artists, inquiries = [], booking, items: initialItems = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [inquiryId, setInquiryId] = useState(booking?.inquiry_id ?? "");
  const [artistId, setArtistId] = useState(booking?.artist_id ?? "");
  const [clientName, setClientName] = useState(booking?.client_name ?? "");
  const [clientEmail, setClientEmail] = useState(booking?.client_email ?? "");
  const [clientPhone, setClientPhone] = useState(booking?.client_phone ?? "");
  const [eventType, setEventType] = useState(booking?.event_type ?? "");
  const [eventDate, setEventDate] = useState(booking?.event_date ?? "");
  const [eventTime, setEventTime] = useState(booking?.event_time ?? "");
  const [duration, setDuration] = useState(String(booking?.event_duration_hours ?? "4"));
  const [venueName, setVenueName] = useState(booking?.venue_name ?? "");
  const [venueCity, setVenueCity] = useState(booking?.venue_city ?? "");
  const [venueAddress, setVenueAddress] = useState(booking?.venue_address ?? "");
  const [fee, setFee] = useState(String(booking?.fee ?? ""));
  const [commissionRate, setCommissionRate] = useState(String(booking?.commission_rate ?? "15"));
  const [depositRate, setDepositRate] = useState(String(booking?.deposit_rate ?? "30"));
  const [travel, setTravel] = useState(booking?.travel_required ?? false);
  const [accommodation, setAccommodation] = useState(booking?.accommodation_required ?? false);
  const [advance, setAdvance] = useState(String(booking?.advance_amount ?? "0"));
  const [notes, setNotes] = useState(booking?.notes ?? "");
  const [internalNotes, setInternalNotes] = useState(booking?.internal_notes ?? "");

  const [items, setItems] = useState<ItemDraft[]>(
    initialItems.map((it, i) => ({
      key: i,
      kind: it.kind,
      artist_id: it.artist_id ?? "",
      title: it.title ?? "",
      description: it.description ?? "",
      amount: String(it.amount ?? ""),
    }))
  );
  const [itemKey, setItemKey] = useState(initialItems.length);

  const addItem = (kind: "artist" | "service") => {
    setItems((prev) => [...prev, { key: itemKey, kind, artist_id: "", title: "", description: "", amount: "" }]);
    setItemKey((k) => k + 1);
  };
  const updateItem = (key: number, patch: Partial<ItemDraft>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  const removeItem = (key: number) => setItems((prev) => prev.filter((it) => it.key !== key));

  const artistName = (id: string) => artists.find((a) => a.id === id)?.name ?? "";
  const itemsTotal = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);

  const feeNum = items.length > 0 ? itemsTotal : parseFloat(fee) || 0;
  const commission = feeNum * (parseFloat(commissionRate) / 100);
  const artistNet = feeNum - commission;
  const deposit = feeNum * (parseFloat(depositRate) / 100);
  const remaining = feeNum - deposit;

  // Tam aktarım (sanatçı, mekan, notlar dahil) server tarafında yapılır
  const fillFromInquiry = (id: string) => {
    setInquiryId(id);
    if (id) router.push(`/admin/bookings/new?inquiry=${id}`);
  };

  const handleSave = () => {
    if (!clientName.trim()) { setError("Müşteri adı zorunlu"); return; }
    if (!feeNum) { setError("Ücret girilmeli — kalem ekleyin veya ücret girin"); return; }
    for (const it of items) {
      if (it.kind === "artist" && !it.artist_id) { setError("Sanatçı kaleminde sanatçı seçilmeli"); return; }
      if (it.kind === "service" && !it.title.trim()) { setError("Hizmet kaleminde başlık girilmeli"); return; }
      if (!(parseFloat(it.amount) > 0)) { setError("Her kalem için tutar girilmeli"); return; }
    }
    setError(null);
    const itemsPayload: BookingItemPayload[] = items.map((it) => ({
      kind: it.kind,
      artist_id: it.kind === "artist" ? it.artist_id : null,
      title: it.kind === "artist" ? (it.title.trim() || artistName(it.artist_id)) : it.title.trim(),
      description: it.description.trim() || null,
      amount: parseFloat(it.amount) || 0,
    }));
    startTransition(async () => {
      try {
        await upsertBooking({
          id: booking?.id,
          inquiry_id: inquiryId || null,
          artist_id: artistId || null,
          items: itemsPayload,
          client_name: clientName.trim(),
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          event_type: eventType || null,
          event_date: eventDate || null,
          event_time: eventTime || null,
          event_duration_hours: parseFloat(duration) || null,
          venue_name: venueName || null,
          venue_city: venueCity || null,
          venue_address: venueAddress || null,
          fee: feeNum,
          commission_rate: parseFloat(commissionRate) || 15,
          deposit_rate: parseFloat(depositRate) || 30,
          travel_required: travel,
          accommodation_required: accommodation,
          advance_amount: parseFloat(advance) || 0,
          notes: notes || null,
          internal_notes: internalNotes || null,
        });
        router.push("/admin/bookings");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hata oluştu");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Talep bağlantısı */}
      {inquiries.length > 0 && !booking?.id && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Mevcut Talepten Oluştur</h2>
          <div>
            <label className={labelCls}>Talep Seç (opsiyonel)</label>
            <select value={inquiryId} onChange={(e) => fillFromInquiry(e.target.value)} className={inputCls}>
              <option value="">— Sıfırdan oluştur</option>
              {inquiries.map((inq) => (
                <option key={inq.id} value={inq.id}>
                  {inq.name} · {inq.event_type ?? "?"} · {inq.event_date ?? "tarih yok"}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Müşteri */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Müşteri</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Ad Soyad *</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ayşe Demir" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>E-posta</label>
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="ayse@…" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Telefon</label>
            <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+90 5XX…" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Teklif kalemleri — çoklu sanatçı + hizmet */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Teklif Kalemleri</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Birden fazla sanatçı ve hizmet ekleyin — teklif sayfasında ve sözleşmede kalem kalem görünür,
            sanatçı kalemleri profil linkiyle birlikte gösterilir. Toplam ücret otomatik hesaplanır.
          </p>
        </div>

        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.key} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium uppercase tracking-wide ${
                    it.kind === "artist" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"
                  }`}>
                    {it.kind === "artist" ? "Sanatçı" : "Hizmet"}
                  </span>
                  <button type="button" onClick={() => removeItem(it.key)}
                    className="text-xs text-muted-foreground hover:text-red-600 transition-colors">
                    Kaldır ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    {it.kind === "artist" ? (
                      <select value={it.artist_id}
                        onChange={(e) => updateItem(it.key, { artist_id: e.target.value })} className={inputCls}>
                        <option value="">— Sanatçı seç</option>
                        {artists.map((a) => (
                          <option key={a.id} value={a.id}>{a.name} ({a.performer_type ?? "—"})</option>
                        ))}
                      </select>
                    ) : (
                      <input value={it.title} onChange={(e) => updateItem(it.key, { title: e.target.value })}
                        placeholder="Hizmet adı — örn. Ses & Işık Sistemi" className={inputCls} />
                    )}
                  </div>
                  <input type="number" min="0" value={it.amount}
                    onChange={(e) => updateItem(it.key, { amount: e.target.value })}
                    placeholder="Tutar ₺" className={inputCls} />
                </div>
                <input value={it.description} onChange={(e) => updateItem(it.key, { description: e.target.value })}
                  placeholder={it.kind === "artist" ? "Açıklama — örn. 4 saat DJ performansı" : "Açıklama (opsiyonel)"}
                  className={inputCls} />
              </div>
            ))}
            <div className="flex justify-between items-center px-1 text-sm">
              <span className="text-muted-foreground">Kalemler toplamı</span>
              <span className="font-semibold text-foreground">{itemsTotal.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={() => addItem("artist")}
            className="text-sm px-4 py-2 rounded-full border border-border text-foreground hover:bg-secondary transition-colors">
            + Sanatçı Ekle
          </button>
          <button type="button" onClick={() => addItem("service")}
            className="text-sm px-4 py-2 rounded-full border border-border text-foreground hover:bg-secondary transition-colors">
            + Hizmet Ekle
          </button>
        </div>
      </div>

      {/* Ana sanatçı (takvim/finans için) */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Ana Sanatçı</h2>
          {items.some((it) => it.kind === "artist") && (
            <p className="text-xs text-muted-foreground mt-1">
              Boş bırakırsanız ilk sanatçı kalemi otomatik atanır — takvim ve finans görünümlerinde kullanılır.
            </p>
          )}
        </div>
        <select value={artistId} onChange={(e) => setArtistId(e.target.value)} className={inputCls}>
          <option value="">— Sanatçı seç</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.performer_type ?? "—"})</option>
          ))}
        </select>
      </div>

      {/* Etkinlik */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Etkinlik</h2>
        <div>
          <label className={labelCls}>Etkinlik Türü</label>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputCls}>
            <option value="">— Seç</option>
            {EVENT_TYPE_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Tarih</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Saat</label>
            <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Süre (saat)</label>
            <input type="number" min="1" max="24" step="0.5" value={duration}
              onChange={(e) => setDuration(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Mekan Adı</label>
          <input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Grand Hotel Ballroom" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Şehir</label>
            <input value={venueCity} onChange={(e) => setVenueCity(e.target.value)} placeholder="İstanbul" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Adres</label>
            <input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="Tam adres…" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Finansal */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Finansal</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Toplam Ücret (₺)</label>
            {items.length > 0 ? (
              <>
                <input value={itemsTotal.toLocaleString("tr-TR")} readOnly disabled
                  className={`${inputCls} bg-secondary/40 cursor-not-allowed`} />
                <p className="text-[10px] text-muted-foreground mt-1">Kalemlerden otomatik</p>
              </>
            ) : (
              <input type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)}
                placeholder="25000" className={inputCls} />
            )}
          </div>
          <div>
            <label className={labelCls}>Komisyon %</label>
            <input type="number" min="0" max="100" value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Kapora %</label>
            <input type="number" min="0" max="100" value={depositRate}
              onChange={(e) => setDepositRate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {feeNum > 0 && (
          <div className="rounded-xl bg-secondary/30 p-4 grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toplam</span>
                <span className="font-medium">{feeNum.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NOQT komisyon ({commissionRate}%)</span>
                <span className="font-medium text-amber-700">{commission.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sanatçı net</span>
                <span className="font-medium text-green-700">{artistNet.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
            <div className="space-y-1.5 border-l border-border pl-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kapora ({depositRate}%)</span>
                <span className="font-medium">{deposit.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kalan ödeme</span>
                <span className="font-medium">{remaining.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
          </div>
        )}

        {/* Gider avansı */}
        <div className="pt-2 border-t border-border space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sanatçı Giderleri</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={travel} onChange={(e) => setTravel(e.target.checked)}
                className="rounded border-border" />
              <span className="text-sm text-foreground">Ulaşım gerekli</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={accommodation} onChange={(e) => setAccommodation(e.target.checked)}
                className="rounded border-border" />
              <span className="text-sm text-foreground">Konaklama gerekli</span>
            </label>
          </div>
          {(travel || accommodation) && (
            <div>
              <label className={labelCls}>Avans Tutarı (₺)</label>
              <input type="number" min="0" value={advance} onChange={(e) => setAdvance(e.target.value)}
                placeholder="0" className={inputCls} />
              <p className="text-xs text-muted-foreground mt-1">Havuzdan sanatçıya önceden ödenecek tutar</p>
            </div>
          )}
        </div>
      </div>

      {/* Notlar */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Notlar</h2>
        <div>
          <label className={labelCls}>Müşteriye Görünür Not</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder="Sözleşmeye ve rapora yansıyacak notlar…"
            className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className={labelCls}>İç Not (müşteriye görünmez)</label>
          <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2}
            placeholder="Sadece admin ekibi görür…"
            className={`${inputCls} resize-none`} />
        </div>
      </div>

      <button onClick={handleSave} disabled={isPending}
        className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
        {isPending ? "Kaydediliyor…" : booking?.id ? "Güncelle" : "Booking Oluştur"}
      </button>
    </div>
  );
}
