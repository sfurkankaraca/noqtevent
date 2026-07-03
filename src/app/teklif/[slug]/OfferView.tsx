"use client";

import { useState, useTransition } from "react";
import {
  calcCashPrice, calcPrepayPrice, isPrepayAvailable, daysUntil,
  TERMS_TEXT, PREPAY_DEADLINE_DAYS, FINAL_PAYMENT_DEADLINE_DAYS, NON_REFUNDABLE_WINDOW_DAYS,
} from "@/lib/bookingTerms";
import { acceptOffer, notifyPaymentClaim, sendOfferOtp, startOnlinePayment } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Booking = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Agreement = Record<string, any> | null;

const fmt = (n: number) => n.toLocaleString("tr-TR") + " ₺";

export default function OfferView({
  booking, slug, agreement, paymentResult = null, paymentMessage = null,
}: {
  booking: Booking;
  slug: string;
  agreement: Agreement;
  paymentResult?: "success" | "error" | null;
  paymentMessage?: string | null;
}) {
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
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(paymentResult === "error" ? (paymentMessage ?? "Ödeme tamamlanamadı.") : null);

  const cashPrice = calcCashPrice(booking.fee ?? 0);
  const prepayPrice = calcPrepayPrice(booking.fee ?? 0);
  const prepayAvailable = isPrepayAvailable(booking.event_date);
  const daysLeft = daysUntil(booking.event_date);
  const agreedPrice = selectedPlan === "cash" ? cashPrice : prepayPrice;

  const eventDateStr = booking.event_date
    ? new Date(booking.event_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const validateForm = (): boolean => {
    setError(null);
    if (!name.trim()) { setError("Ad soyad girin."); return false; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Geçerli bir e-posta adresi girin."); return false; }
    if (!agreeChecked) { setError("Devam etmek için şartları kabul etmelisiniz."); return false; }
    return true;
  };

  // 1. adım: e-postaya tek kullanımlık doğrulama kodu gönder
  const handleSendOtp = async () => {
    if (!validateForm()) return;
    setSendingOtp(true);
    try {
      await sendOfferOtp(slug, email.trim());
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kod gönderilemedi");
    } finally {
      setSendingOtp(false);
    }
  };

  // 2. adım: kodu doğrula ve sözleşmeyi onayla
  const handleAccept = () => {
    if (!validateForm()) return;
    if (!/^\d{6}$/.test(otp.trim())) { setError("E-postanıza gelen 6 haneli kodu girin."); return; }
    startTransition(async () => {
      try {
        await acceptOffer({
          slug, name: name.trim(), email: email.trim(), otp: otp.trim(),
          plan: selectedPlan,
        });
        setAccepted(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bir hata oluştu");
      }
    });
  };

  // iyzico Checkout Form'a yönlendir — tutar sunucuda hesaplanır
  const handlePayOnline = async () => {
    setPayError(null);
    setPaying(true);
    try {
      const { paymentPageUrl } = await startOnlinePayment(slug);
      window.location.href = paymentPageUrl;
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Ödeme başlatılamadı");
      setPaying(false);
    }
  };

  const handleClaimPayment = async () => {
    setClaiming(true);
    try {
      await notifyPaymentClaim(slug, selectedPlan);
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
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (otpSent) { setOtpSent(false); setOtp(""); } }}
                placeholder="E-posta" type="email" className={inputCls}
              />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreeChecked} onChange={(e) => setAgreeChecked(e.target.checked)}
                className="mt-0.5 rounded border-border" />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Yukarıdaki fiyatı ve rezervasyon koşullarını okudum, {selectedPlan === "cash" ? "peşin" : "ön ödemeli"} plan ile
                <strong className="text-foreground"> {fmt(agreedPrice)}</strong> bedeli kabul ediyorum. Bu onay, taraflar arasında bağlayıcı bir sözleşme oluşturur.
              </span>
            </label>
            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                disabled={sendingOtp || (!prepayAvailable && selectedPlan === "prepay")}
                className="w-full py-3.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sendingOtp ? "Kod gönderiliyor…" : "E-posta ile Doğrula ve Onayla"}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">{email.trim()}</strong> adresine 6 haneli doğrulama kodu gönderdik.
                  Kodu girerek onayınızı tamamlayın.
                </p>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 haneli kod"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`${inputCls} text-center tracking-[0.5em] font-semibold`}
                />
                <button
                  onClick={handleAccept}
                  disabled={isPending || (!prepayAvailable && selectedPlan === "prepay")}
                  className="w-full py-3.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Sözleşme oluşturuluyor…" : "Kodu Doğrula, Şartları Kabul Et ve Onayla"}
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {sendingOtp ? "Gönderiliyor…" : "Kodu tekrar gönder"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <span>✓</span>
              <p className="text-sm font-semibold">Sözleşme onaylandı</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPlan === "cash" ? "Peşin" : "Ön ödemeli"} plan ile <strong className="text-foreground">{fmt(agreedPrice)}</strong> tutarını kabul ettiniz.
              Sözleşmeniz PDF olarak e-posta adresinize gönderildi.
            </p>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold text-foreground mb-2">Ödeme</p>

              {paymentResult === "success" && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
                  ✓ Ödemeniz başarıyla alındı. Makbuzunuz e-posta adresinize gönderildi.
                </p>
              )}
              {payError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">{payError}</p>
              )}

              {booking.status === "full_paid" ? (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  Ödemeniz tamamlandı — rezervasyonunuz kesinleşti. Etkinliğinizde görüşmek üzere! 🎉
                </p>
              ) : (
                <>
                  {(() => {
                    const depositAmount = Math.round(agreedPrice * ((booking.deposit_rate ?? 30) / 100));
                    const dueNow = booking.status === "deposit_paid"
                      ? agreedPrice - depositAmount
                      : selectedPlan === "prepay" ? depositAmount : agreedPrice;
                    const dueLabel = booking.status === "deposit_paid"
                      ? "Kalan Ödemeyi Kartla Yap"
                      : selectedPlan === "prepay" ? "Ön Ödemeyi Kartla Yap" : "Kartla Öde";
                    return (
                      <button
                        onClick={handlePayOnline}
                        disabled={paying}
                        className="w-full py-3.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {paying ? "Ödeme sayfasına yönlendiriliyorsunuz…" : `${dueLabel} — ${fmt(dueNow)}`}
                      </button>
                    );
                  })()}
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    iyzico güvencesiyle · Kart bilgileriniz sitemizde saklanmaz
                  </p>

                  <div className="mt-4 pt-3 border-t border-border/60">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      Dilerseniz banka havalesi ile de ödeyebilirsiniz — havale sonrası aşağıdan bize bildirin.
                    </p>
                    {!paymentClaimed ? (
                      <button
                        onClick={handleClaimPayment}
                        disabled={claiming}
                        className="w-full py-2.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
                      >
                        {claiming ? "Bildiriliyor…" : "Havale ile Ödedim, Bildir"}
                      </button>
                    ) : (
                      <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        Bildiriminiz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecek.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
