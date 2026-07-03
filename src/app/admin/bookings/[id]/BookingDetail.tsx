"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateBookingStatus, addPayment, type BookingStatus } from "../actions";
import DeliveryManager from "./DeliveryManager";
import OfferManager from "./OfferManager";
import CancelBookingPanel from "./CancelBookingPanel";

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  draft:        { label: "Taslak",             cls: "bg-gray-100 text-gray-600",     dot: "bg-gray-400" },
  offer_sent:   { label: "Teklif Gönderildi",  cls: "bg-blue-50 text-blue-700",      dot: "bg-blue-500" },
  confirmed:    { label: "Onaylandı",          cls: "bg-cyan-50 text-cyan-700",      dot: "bg-cyan-500" },
  contracted:   { label: "Sözleşme İmzalandı",cls: "bg-violet-50 text-violet-700",  dot: "bg-violet-500" },
  deposit_paid: { label: "Kapora Alındı",      cls: "bg-amber-50 text-amber-700",    dot: "bg-amber-500" },
  full_paid:    { label: "Tam Ödeme Alındı",   cls: "bg-orange-50 text-orange-700",  dot: "bg-orange-500" },
  completed:    { label: "Tamamlandı",         cls: "bg-green-50 text-green-700",    dot: "bg-green-500" },
  cancelled:    { label: "İptal",              cls: "bg-red-50 text-red-700",        dot: "bg-red-400" },
};

const STATUS_FLOW: Record<string, { next: BookingStatus; label: string; cls: string }[]> = {
  draft:        [{ next: "offer_sent",   label: "Teklif Gönder →",       cls: "bg-blue-600 text-white" }],
  offer_sent:   [{ next: "confirmed",   label: "Müşteri Onayladı →",     cls: "bg-cyan-600 text-white" },
                 { next: "cancelled",   label: "İptal Et",               cls: "bg-red-100 text-red-700" }],
  confirmed:    [{ next: "contracted",  label: "Sözleşme İmzalandı →",  cls: "bg-violet-600 text-white" },
                 { next: "cancelled",   label: "İptal Et",               cls: "bg-red-100 text-red-700" }],
  contracted:   [{ next: "deposit_paid", label: "Kapora Alındı →",      cls: "bg-amber-500 text-white" },
                 { next: "cancelled",   label: "İptal Et",               cls: "bg-red-100 text-red-700" }],
  deposit_paid: [{ next: "full_paid",   label: "Tam Ödeme Alındı →",    cls: "bg-orange-500 text-white" }],
  full_paid:    [{ next: "completed",   label: "Etkinlik Tamamlandı ✓", cls: "bg-green-600 text-white" }],
  completed:    [],
  cancelled:    [],
};

const STATUS_TIMELINE = [
  "draft", "offer_sent", "confirmed", "contracted",
  "deposit_paid", "full_paid", "completed",
];

type Payment = {
  id: string; type: string; amount: number; direction: string;
  description: string | null; paid_at: string | null; status: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BookingDetail({ booking, payments, artists }: {
  booking: Record<string, any>;
  payments: Payment[];
  artists: { id: string; name: string; performer_type: string | null }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [contractGenerating, setContractGenerating] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(booking.contract_url ?? null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payType, setPayType] = useState("deposit");
  const [payAmount, setPayAmount] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const meta = STATUS_META[booking.status] ?? STATUS_META.draft;
  const actions = STATUS_FLOW[booking.status] ?? [];
  const fee: number = booking.fee ?? 0;
  const commRate: number = booking.commission_rate ?? 15;
  const depRate: number = booking.deposit_rate ?? 30;
  const commission = fee * (commRate / 100);
  const artistNet = fee - commission;
  const depositAmt = fee * (depRate / 100);
  const remaining = fee - depositAmt;

  const totalIn = payments.filter((p) => p.direction === "inbound" && p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);
  const totalOut = payments.filter((p) => p.direction === "outbound" && p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);
  const balance = totalIn - totalOut;

  const fmt = (n: number) => n.toLocaleString("tr-TR");

  const handleGenerateContract = async () => {
    setContractGenerating(true);
    setErr(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/contract`, { method: "POST" });
      if (!res.ok) throw new Error("PDF oluşturulamadı");
      const url = res.headers.get("X-Contract-Url");
      if (url) setContractUrl(url);
      // PDF'i yeni sekmede aç
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      window.open(objUrl, "_blank");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Hata");
    } finally {
      setContractGenerating(false);
    }
  };

  const handleStatusChange = (next: BookingStatus) => {
    setErr(null);
    startTransition(async () => {
      try { await updateBookingStatus(booking.id, next); }
      catch (e) { setErr(e instanceof Error ? e.message : "Hata"); }
    });
  };

  const handleAddPayment = () => {
    const amt = parseFloat(payAmount);
    if (!amt) return;
    const direction = ["deposit", "full", "advance_refund"].includes(payType) ? "inbound" : "outbound";
    startTransition(async () => {
      try {
        await addPayment(booking.id, { type: payType, amount: amt, direction, description: payDesc || undefined });
        setShowPaymentForm(false);
        setPayAmount("");
        setPayDesc("");
      } catch (e) { setErr(e instanceof Error ? e.message : "Hata"); }
    });
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40";

  const PAYMENT_TYPES = [
    { value: "deposit",        label: "Kapora (gelen)",             direction: "inbound" },
    { value: "full",           label: "Tam ödeme (gelen)",          direction: "inbound" },
    { value: "advance",        label: "Sanatçı avansı (giden)",     direction: "outbound" },
    { value: "artist_payment", label: "Sanatçı ödemesi (giden)",    direction: "outbound" },
    { value: "refund",         label: "İade (giden)",               direction: "outbound" },
  ];

  const PAYMENT_LABELS: Record<string, string> = {
    deposit: "Kapora", full: "Tam Ödeme", advance: "Avans",
    artist_payment: "Sanatçı Ödemesi", refund: "İade",
  };

  const currentIdx = STATUS_TIMELINE.indexOf(booking.status);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sol: Detaylar */}
      <div className="lg:col-span-2 space-y-5">
        {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}

        {/* Durum + Timeline */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${meta.cls}`}>{meta.label}</span>
            <Link href={`/admin/bookings/${booking.id}/edit`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Düzenle
            </Link>
          </div>

          {/* Timeline bar */}
          <div className="flex items-center gap-0">
            {STATUS_TIMELINE.map((s, i) => {
              const done = i <= currentIdx && booking.status !== "cancelled";
              const active = i === currentIdx && booking.status !== "cancelled";
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 transition-all ${
                    active ? "border-foreground bg-foreground" :
                    done ? "border-foreground bg-foreground/40" :
                    "border-border bg-background"
                  }`} />
                  {i < STATUS_TIMELINE.length - 1 && (
                    <div className={`flex-1 h-0.5 ${done && i < currentIdx ? "bg-foreground/40" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-0">
            {STATUS_TIMELINE.map((s, i) => (
              <div key={s} className={`flex-1 last:flex-none text-[9px] leading-none pt-1 ${
                i === currentIdx ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}>
                {STATUS_META[s]?.label.split(" ")[0]}
              </div>
            ))}
          </div>

          {/* Aksiyon butonları */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {actions.map((a) => (
                <button key={a.next} onClick={() => handleStatusChange(a.next)} disabled={isPending}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-opacity disabled:opacity-50 ${a.cls}`}>
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Kapora/tam ödeme alındıktan sonra iptal — iade akışını içerir */}
          {["deposit_paid", "full_paid"].includes(booking.status) && (
            <div className="pt-1">
              <CancelBookingPanel bookingId={booking.id} totalPaid={totalIn} eventDate={booking.event_date ?? null} />
            </div>
          )}
        </div>

        {/* Müşteri + Sanatçı */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Müşteri</p>
            <p className="font-semibold text-foreground">{booking.client_name}</p>
            {booking.client_email && <p className="text-sm text-muted-foreground">{booking.client_email}</p>}
            {booking.client_phone && <p className="text-sm text-muted-foreground">{booking.client_phone}</p>}
          </div>
          <div className="bg-white rounded-2xl border border-border p-5 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sanatçı</p>
            {booking.dj_profiles ? (
              <>
                <p className="font-semibold text-foreground">{booking.dj_profiles.name}</p>
                <p className="text-sm text-muted-foreground">{booking.dj_profiles.performer_type}</p>
                {booking.dj_profiles.slug && (
                  <a href={`/s/${booking.dj_profiles.slug}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Presskit ↗
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sanatçı atanmadı</p>
            )}
          </div>
        </div>

        {/* Etkinlik */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Etkinlik</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              ["Tür", booking.event_type],
              ["Tarih", booking.event_date ? new Date(booking.event_date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null],
              ["Saat", booking.event_time],
              ["Süre", booking.event_duration_hours ? `${booking.event_duration_hours} saat` : null],
              ["Mekan", booking.venue_name],
              ["Şehir", booking.venue_city],
              ["Adres", booking.venue_address],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k as string} className="flex gap-2">
                <span className="text-muted-foreground w-16 flex-shrink-0">{k}</span>
                <span className="text-foreground font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ödeme hareketleri */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ödeme Hareketleri</p>
            <button onClick={() => setShowPaymentForm((p) => !p)}
              className="text-xs px-3 py-1.5 border border-border rounded-full text-foreground hover:bg-secondary transition-colors">
              + Hareket Ekle
            </button>
          </div>

          {showPaymentForm && (
            <div className="rounded-xl border border-border p-4 space-y-3 bg-secondary/10">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Tür</p>
                  <select value={payType} onChange={(e) => setPayType(e.target.value)} className={inputCls}>
                    {PAYMENT_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Tutar (₺)</p>
                  <input type="number" min="0" value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)} placeholder="0" className={inputCls} />
                </div>
              </div>
              <input value={payDesc} onChange={(e) => setPayDesc(e.target.value)}
                placeholder="Açıklama (opsiyonel)" className={inputCls} />
              <div className="flex gap-2">
                <button onClick={handleAddPayment} disabled={isPending || !payAmount}
                  className="px-4 py-2 bg-foreground text-background rounded-full text-xs font-medium hover:opacity-90 disabled:opacity-50">
                  Kaydet
                </button>
                <button onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 border border-border rounded-full text-xs text-muted-foreground hover:text-foreground">
                  İptal
                </button>
              </div>
            </div>
          )}

          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz ödeme hareketi yok</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{PAYMENT_LABELS[p.type] ?? p.type}</p>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    {p.paid_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.paid_at).toLocaleDateString("tr-TR")}
                      </p>
                    )}
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${
                    p.direction === "inbound" ? "text-green-700" : "text-red-600"
                  }`}>
                    {p.direction === "inbound" ? "+" : "-"}{fmt(p.amount)} ₺
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notlar */}
        {(booking.notes || booking.internal_notes) && (
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            {booking.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Not</p>
                <p className="text-sm text-foreground leading-relaxed">{booking.notes}</p>
              </div>
            )}
            {booking.internal_notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">İç Not</p>
                <p className="text-sm text-foreground leading-relaxed">{booking.internal_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sağ: Finansal Özet */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Finansal Özet</p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Toplam ücret</span>
              <span className="font-semibold tabular-nums">{fmt(fee)} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Komisyon ({commRate}%)</span>
              <span className="font-medium text-amber-700 tabular-nums">{fmt(commission)} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sanatçı net</span>
              <span className="font-medium text-green-700 tabular-nums">{fmt(artistNet)} ₺</span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kapora ({depRate}%)</span>
              <span className="tabular-nums">{fmt(depositAmt)} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kalan ödeme</span>
              <span className="tabular-nums">{fmt(remaining)} ₺</span>
            </div>
            {booking.advance_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sanatçı avansı</span>
                <span className="text-red-600 tabular-nums">-{fmt(booking.advance_amount)} ₺</span>
              </div>
            )}
          </div>
        </div>

        {/* Havuz durumu */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">NOQT Havuzu</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gelen</span>
              <span className="text-green-700 font-semibold tabular-nums">+{fmt(totalIn)} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Giden</span>
              <span className="text-red-600 font-semibold tabular-nums">-{fmt(totalOut)} ₺</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-medium text-foreground">Havuz bakiyesi</span>
              <span className={`font-bold tabular-nums ${balance >= 0 ? "text-green-700" : "text-red-600"}`}>
                {fmt(balance)} ₺
              </span>
            </div>
          </div>
        </div>

        {/* Sanatçı giderleri */}
        {(booking.travel_required || booking.accommodation_required) && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2">
            <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">Sanatçı Giderleri</p>
            <div className="space-y-1 text-sm">
              {booking.travel_required && (
                <div className="flex items-center gap-2 text-amber-800">
                  <span>✈️</span> Ulaşım gerekli
                </div>
              )}
              {booking.accommodation_required && (
                <div className="flex items-center gap-2 text-amber-800">
                  <span>🏨</span> Konaklama gerekli
                </div>
              )}
              {booking.advance_amount > 0 && (
                <div className="flex justify-between text-amber-800 font-medium pt-1">
                  <span>Avans tutarı</span>
                  <span>{fmt(booking.advance_amount)} ₺</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teklif & Ödeme */}
        <OfferManager
          bookingId={booking.id}
          clientName={booking.client_name}
          clientEmail={booking.client_email}
          fee={booking.fee ?? 0}
          initialSlug={booking.offer_slug}
          paymentPlan={booking.payment_plan}
        />

        {/* Sözleşme */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sözleşme</p>
          <button
            onClick={handleGenerateContract}
            disabled={contractGenerating}
            className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {contractGenerating ? "PDF Oluşturuluyor…" : contractUrl ? "Sözleşmeyi Yeniden Oluştur" : "Sözleşme Oluştur (PDF)"}
          </button>
          {contractUrl && (
            <a
              href={contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors"
            >
              📄 Mevcut Sözleşmeyi Aç
            </a>
          )}
          <p className="text-xs text-muted-foreground">
            PDF oluşturulunca müşteri ve sanatçıya otomatik e-posta gönderilir.
          </p>
        </div>

        {/* Teslimat (etkinlik tamamlandıysa) */}
        {(booking.status === "completed" || booking.status === "full_paid") && (
          <DeliveryManager
            bookingId={booking.id}
            clientName={booking.client_name}
            clientEmail={booking.client_email}
            initialSlug={booking.delivery_slug}
            initialPhotos={Array.isArray(booking.delivery_photos) ? booking.delivery_photos : []}
            initialVideos={Array.isArray(booking.delivery_videos) ? booking.delivery_videos : []}
            initialNotes={booking.delivery_notes}
            sentAt={booking.delivery_sent_at}
          />
        )}

        {/* Hızlı linkler */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hızlı Linkler</p>
          <div className="space-y-1.5">
            <Link href={`/admin/bookings/${booking.id}/edit`}
              className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors">
              ✏️ Booking Düzenle
            </Link>
            {booking.dj_profiles?.slug && (
              <a href={`/s/${booking.dj_profiles.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors">
                📄 Sanatçı Presskit
              </a>
            )}
            {booking.dj_profiles?.id && (
              <Link href={`/admin/djler/${booking.dj_profiles.id}/presskit`}
                className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors">
                🎨 Presskit Builder
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
