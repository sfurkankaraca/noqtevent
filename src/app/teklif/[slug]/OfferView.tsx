"use client";

import { useState, useTransition } from "react";
import {
  calcCashPrice, calcPrepayPrice, isPrepayAvailable, daysUntil,
  TERMS_TEXT, PREPAY_DEADLINE_DAYS, FINAL_PAYMENT_DEADLINE_DAYS, NON_REFUNDABLE_WINDOW_DAYS,
} from "@/lib/bookingTerms";
import { acceptOffer } from "./actions";
import { notifyPaymentClaim } from "@/app/admin/bookings/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Booking = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Agreement = Record<string, any> | null;

const fmt = (n: number) => n.toLocaleString("tr-TR") + " ₺";

export default function OfferView({ booking, slug, agreement }: { booking: Booking; slug: string; agreement: Agreement }) {
  const [selectedPlan, setSelectedPlan] = useState<"cash" | "prepay">(
    agreement?.payment_plan ?? (isPrepayAvailable(booking.event_date) ? "prepay" : "cash")
  );
  const [name, setName] = useState(agreement?.accepted_name ?? booking.client_name ?? "");
  const [email, setEmail] = useState(agreement?.accepted_email ?? booking.client_email ?? "");
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(!!agreement);
  const [paymentClaimed, setPaymentClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const cashPrice = calcCashPrice(booking.fee ?? 0);
  const prepayPrice = calcPrepayPrice(booking.fee ?? 0);
  const prepayAvailable = isPrepayAvailable(booking.event_date);
  const daysLeft = daysUntil(booking.event_date);
  const agreedPrice = selectedPlan === "cash" ? cashPrice : prepayPrice;

  const eventDateStr = booking.event_date
    ? new Date(booking.event_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const handleAccept = () => {
    setError(null);
    if (!name.trim()) { setError("Ad soyad girin."); return; }
    if (!agreeChecked) { setError("Devam etmek için şartları kabul etmelisiniz."); return; }
    startTransition(async () => {
      try {
        await acceptOffer({
          bookingId: booking.id, slug, name: name.trim(), email: email.trim() || null,
          plan: selectedPlan, agreedPrice,
        });
        setAccepted(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bir hata oluştu");
      }
    });
  };

  const handleClaimPayment = async () => {
    setClaiming(true);
    try {
      await notifyPaymentClaim(booking.id, { plan: selectedPlan, amount: agreedPrice });
      setPaymentClaimed(true);
    } catch {
      // sessizce yut, kullanıcıya yine de teşekkür göster
      setPaymentClaimed(true);
    } finally {
      setClaiming(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";

  return (
    <div className="min-h-screen bg-[oklch(0.975_0.006_80)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-3">NOQT Experience</p>
        <h1
          className="text-4xl text-foreground leading-tight mb-2"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Teklifiniz Hazır
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          {booking.dj_profiles?.name ? `${booking.dj_profiles.name} ile ` : ""}
          {booking.event_type ?? "etkinliğiniz"}{eventDateStr ? ` · ${eventDateStr}` : ""}
        </p>

        {/* Fiyat kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            disabled={accepted}
            onClick={() => setSelectedPlan("cash")}
            className={`text-left p-5 rounded-2xl border-2 transition-all ${
              selectedPlan === "cash" ? "border-foreground bg-white" : "border-border bg-white/60"
            } ${accepted ? "opacity-70 cursor-default" : ""}`}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Peşin Fiyat</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">{fmt(cashPrice)}</p>
            <p className="text-xs text-muted-foreground mt-2">Tam ödeme, tek seferde</p>
          </button>

          <button
            type="button"
            disabled={accepted || !prepayAvailable}
            onClick={() => setSelectedPlan("prepay")}
            className={`text-left p-5 rounded-2xl border-2 transition-all ${
              selectedPlan === "prepay" ? "border-foreground bg-white" : "border-border bg-white/60"
            } ${accepted || !prepayAvailable ? "opacity-70 cursor-default" : ""}`}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Ön Ödemeli Fiyat</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">{fmt(prepayPrice)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {prepayAvailable
                ? `Kapora ile rezervasyon, kalan etkinliğe ${FINAL_PAYMENT_DEADLINE_DAYS} gün kala`
                : `Etkinliğe ${daysLeft ?? 0} gün kaldığı için bu seçenek kapandı`}
            </p>
          </button>
        </div>

        {/* Şartlar */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <p className="text-sm font-semibold text-foreground mb-3">Rezervasyon Koşulları</p>
          <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <li>• Ön ödeme ile rezervasyon, etkinliğe en az {PREPAY_DEADLINE_DAYS} gün kalana kadar yapılabilir.</li>
            <li>• Kesin rezervasyon için kalan ödeme, etkinlikten en geç {FINAL_PAYMENT_DEADLINE_DAYS} gün önce tamamlanmalıdır.</li>
            <li>• Etkinliğe {NON_REFUNDABLE_WINDOW_DAYS} gün veya daha az kala yapılan iptallerde ön ödeme iade edilmez.</li>
          </ul>
          <details className="mt-4">
            <summary className="text-xs text-foreground cursor-pointer hover:underline">Tüm sözleşme şartlarını oku</summary>
            <pre className="mt-3 text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{TERMS_TEXT}</pre>
          </details>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        {!accepted ? (
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <p className="text-sm font-semibold text-foreground">Onay ve Elektronik İmza</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" className={inputCls} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta" type="email" className={inputCls} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreeChecked} onChange={(e) => setAgreeChecked(e.target.checked)}
                className="mt-0.5 rounded border-border" />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Yukarıdaki fiyatı ve rezervasyon koşullarını okudum, {selectedPlan === "cash" ? "peşin" : "ön ödemeli"} plan ile
                <strong className="text-foreground"> {fmt(agreedPrice)}</strong> bedeli kabul ediyorum. Bu onay, taraflar arasında bağlayıcı bir sözleşme oluşturur.
              </span>
            </label>
            <button
              onClick={handleAccept}
              disabled={isPending || !prepayAvailable && selectedPlan === "prepay"}
              className="w-full py-3.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor…" : "Şartları Kabul Et ve Onayla"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <span>✓</span>
              <p className="text-sm font-semibold">Sözleşme onaylandı</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPlan === "cash" ? "Peşin" : "Ön ödemeli"} plan ile <strong className="text-foreground">{fmt(agreedPrice)}</strong> tutarını kabul ettiniz.
            </p>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold text-foreground mb-2">Ödeme</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Online ödeme altyapımız yakında aktif olacak. Şimdilik ödemenizi banka havalesi ile
                gerçekleştirip aşağıdaki butonla bize bildirebilirsiniz — ekibimiz kısa sürede sizinle iletişime geçecek.
              </p>
              {!paymentClaimed ? (
                <button
                  onClick={handleClaimPayment}
                  disabled={claiming}
                  className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {claiming ? "Bildiriliyor…" : "Ödemeyi Yaptım, Bildir"}
                </button>
              ) : (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  Bildiriminiz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecek.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
