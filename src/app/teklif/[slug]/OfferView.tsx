"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  calcCashPrice, calcPrepayPrice, isPrepayAvailable, daysUntil,
  TERMS_TEXT, PREPAY_DEADLINE_DAYS, FINAL_PAYMENT_GRACE_DAYS, NON_REFUNDABLE_WINDOW_DAYS,
} from "@/lib/bookingTerms";
import { acceptOffer, notifyPaymentClaim, selectOfferPackage, sendOfferOtp, startOnlinePayment, submitOfferSelections } from "./actions";
import type { BookingItem } from "@/lib/bookingItems";
import type { OfferPackage } from "@/lib/offerPackages";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Booking = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Agreement = Record<string, any> | null;

export type OfferArtist = {
  id: string;
  name: string;
  performer_type: string | null;
  photo_url: string | null;
  bio: string | null;
  speciality: string | null;
  slug: string | null;
};

export type OfferConcept = {
  id: string;
  name: string;
  image_url: string;
};

const fmt = (n: number) => n.toLocaleString("tr-TR") + " ₺";
const Vat = () => <span className="text-[0.7em] font-normal text-muted-foreground"> + KDV</span>;

type BankInfo = { iban: string; accountName: string; bankName: string | null } | null;

export default function OfferView({
  booking, slug, items = [], packages = [], agreement, bankInfo = null, expired = false, paymentResult = null, paymentMessage = null,
  offerArtists = [], offerConcepts = [],
}: {
  booking: Booking;
  slug: string;
  items?: BookingItem[];
  packages?: OfferPackage[];
  agreement: Agreement;
  bankInfo?: BankInfo;
  expired?: boolean;
  paymentResult?: "success" | "error" | null;
  paymentMessage?: string | null;
  offerArtists?: OfferArtist[];
  offerConcepts?: OfferConcept[];
}) {
  const router = useRouter();

  // Çok seçenekli teklif — müşteri paketlerden birini seçmeden fiyat/onay açılmaz
  const [selPackageId, setSelPackageId] = useState<string | null>(booking.selected_package_id ?? null);
  const [pkgPending, setPkgPending] = useState<string | null>(null);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const packagesLocked = packages.length > 0 && !!agreement;
  // Sözleşme zaten onaylandıysa (fiyat kilitli) paket seçimi dayatılmaz
  const needsPackageChoice = packages.length > 0 && !selPackageId && !agreement;

  const handleSelectPackage = async (id: string) => {
    if (packagesLocked) return;
    setPkgError(null);
    setPkgPending(id);
    try {
      await selectOfferPackage(slug, id);
      setSelPackageId(id);
      // Seçilen paketin bedeli sunucuda booking.fee'ye yazıldı — fiyatları tazele
      router.refresh();
    } catch (e) {
      setPkgError(e instanceof Error ? e.message : "Paket seçilemedi. Lütfen tekrar deneyin.");
    } finally {
      setPkgPending(null);
    }
  };

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
  const [copied, setCopied] = useState<string | null>(null);

  // Sanatçı/konsept seçimi — mevcut kayıtlı seçim varsa onunla başlar
  const [selArtistId, setSelArtistId] = useState<string | null>(booking.offer_selected_artist_id ?? null);
  const [selConceptId, setSelConceptId] = useState<string | null>(booking.offer_selected_concept_id ?? null);
  const [selNote, setSelNote] = useState("");
  const [selSubmitting, setSelSubmitting] = useState(false);
  const [selSubmitted, setSelSubmitted] = useState(!!booking.offer_selection_at);
  const [selError, setSelError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<OfferConcept | null>(null);

  const handleSubmitSelections = async () => {
    setSelError(null);
    setSelSubmitting(true);
    try {
      await submitOfferSelections(slug, { artistId: selArtistId, conceptId: selConceptId, note: selNote });
      setSelSubmitted(true);
    } catch (e) {
      setSelError(e instanceof Error ? e.message : "Gönderilemedi");
    } finally {
      setSelSubmitting(false);
    }
  };

  const copyToClipboard = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      // clipboard izni yoksa sessizce geç
    }
  };

  const prepayMarkupRate = booking.prepay_markup_rate ?? 25;
  const cashPrice = calcCashPrice(booking.fee ?? 0);
  const prepayPrice = calcPrepayPrice(booking.fee ?? 0, prepayMarkupRate);
  const prepayAvailable = isPrepayAvailable(booking.event_date);
  const daysLeft = daysUntil(booking.event_date);
  const agreedPrice = selectedPlan === "cash" ? cashPrice : prepayPrice;
  const depositRate = booking.deposit_rate ?? 30;
  const prepayDeposit = Math.round(prepayPrice * (depositRate / 100));

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
          {(() => {
            const names = items.filter((i) => i.kind === "artist" && i.dj_profiles?.name).map((i) => i.dj_profiles!.name);
            const label = names.length > 0 ? names.join(" + ") : booking.dj_profiles?.name;
            return label ? `${label} ile ` : "";
          })()}
          {booking.event_type ?? "etkinliğiniz"}{eventDateStr ? ` · ${eventDateStr}` : ""}
        </p>

        {/* Teklif kapsamı — sanatçı ve hizmet kalemleri */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6 mb-8">
            <p className="text-sm font-semibold text-foreground mb-4">Teklif Kapsamı</p>
            <div className="divide-y divide-border">
              {items.map((it) => (
                <div key={it.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {it.title}
                      {it.kind === "artist" && it.dj_profiles?.performer_type && (
                        <span className="text-muted-foreground font-normal"> · {it.dj_profiles.performer_type}</span>
                      )}
                    </p>
                    {it.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{it.description}</p>
                    )}
                    {it.kind === "artist" && it.artist_id && (
                      <a
                        href={`/sanatcilar/${it.artist_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 text-xs text-foreground underline underline-offset-2 hover:text-foreground/80"
                      >
                        Sanatçı profilini incele ↗
                      </a>
                    )}
                  </div>
                  {Number(it.amount) > 0 && (
                    <p className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
                      {fmt(Number(it.amount))}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 mt-1 border-t border-border">
              <span className="text-sm text-muted-foreground">Toplam (peşin fiyat)</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">{fmt(cashPrice)}<Vat /></span>
            </div>
            <a
              href={`/api/teklif/${slug}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              download={`noqt-teklif-${slug}.pdf`}
              className="inline-block mt-4 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Teklifi PDF olarak indir
            </a>
          </div>
        )}

        {/* Sanatçı seçenekleri — admin'in bu teklife eklediği adaylar, portfolyo linkiyle */}
        {offerArtists.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6 mb-8">
            <p className="text-sm font-semibold text-foreground mb-1">Sanatçı Seçenekleri</p>
            <p className="text-xs text-muted-foreground mb-4">
              Etkinliğiniz için önerdiğimiz sanatçılar — portfolyolarını inceleyip beğendiğinizi işaretleyin.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {offerArtists.map((artist) => {
                const selected = selArtistId === artist.id;
                return (
                  <div key={artist.id}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${
                      selected ? "border-foreground" : "border-border"
                    }`}>
                    {artist.photo_url && (
                      <div className="relative aspect-[4/3] bg-secondary/30">
                        <Image src={artist.photo_url} alt={artist.name} fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{artist.name}</p>
                        {(artist.speciality || artist.performer_type) && (
                          <p className="text-xs text-muted-foreground">{artist.speciality ?? artist.performer_type}</p>
                        )}
                      </div>
                      {artist.bio && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{artist.bio}</p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelArtistId(selected ? null : artist.id)}
                          className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${
                            selected
                              ? "bg-foreground text-background"
                              : "border border-border text-foreground hover:border-foreground/40"
                          }`}
                        >
                          {selected ? "✓ Seçildi" : "Bu Sanatçıyı Seç"}
                        </button>
                        <a
                          href={`/sanatcilar/${artist.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                        >
                          Portfolyo ↗
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Konsept görsel seçenekleri */}
        {offerConcepts.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6 mb-8">
            <p className="text-sm font-semibold text-foreground mb-1">Konsept Seçenekleri</p>
            <p className="text-xs text-muted-foreground mb-4">
              Etkinliğiniz için hazırladığımız konseptler — görsele tıklayarak büyütebilir, beğendiğinizi seçebilirsiniz.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {offerConcepts.map((concept) => {
                const selected = selConceptId === concept.id;
                return (
                  <div key={concept.id}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${
                      selected ? "border-foreground" : "border-border"
                    }`}>
                    <button type="button" onClick={() => setLightbox(concept)}
                      className="relative aspect-[3/4] w-full bg-secondary/30 block">
                      <Image src={concept.image_url} alt={concept.name} fill className="object-cover" unoptimized />
                    </button>
                    <div className="p-2.5 space-y-1.5">
                      <p className="text-xs font-medium text-foreground leading-snug">{concept.name}</p>
                      <button
                        type="button"
                        onClick={() => setSelConceptId(selected ? null : concept.id)}
                        className={`w-full py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                          selected
                            ? "bg-foreground text-background"
                            : "border border-border text-foreground hover:border-foreground/40"
                        }`}
                      >
                        {selected ? "✓ Seçildi" : "Seç"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Seçim gönderme */}
        {(offerArtists.length > 0 || offerConcepts.length > 0) && (
          <div className="bg-white rounded-2xl border border-border p-6 mb-8 space-y-3">
            {selSubmitted ? (
              <div className="flex items-start gap-2 text-green-700">
                <span>✓</span>
                <div>
                  <p className="text-sm font-semibold">Tercihiniz bize ulaştı</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seçiminizi aldık — teklifi buna göre netleştirip en kısa sürede size döneceğiz.
                    Fikriniz değişirse yeniden seçip tekrar gönderebilirsiniz.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelSubmitted(false)}
                    className="mt-2 text-xs text-foreground underline underline-offset-2 hover:text-foreground/80"
                  >
                    Seçimi değiştir
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">Tercihinizi Gönderin</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    selArtistId ? `Sanatçı: ${offerArtists.find((a) => a.id === selArtistId)?.name}` : null,
                    selConceptId ? `Konsept: ${offerConcepts.find((c) => c.id === selConceptId)?.name}` : null,
                  ].filter(Boolean).join(" · ") || "Yukarıdan beğendiğiniz sanatçıyı ve/veya konsepti işaretleyin."}
                </p>
                <textarea
                  value={selNote}
                  onChange={(e) => setSelNote(e.target.value)}
                  rows={2}
                  placeholder="Eklemek istediğiniz not (opsiyonel)…"
                  className={`${inputCls} resize-none text-xs`}
                />
                {selError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{selError}</p>
                )}
                <button
                  type="button"
                  onClick={handleSubmitSelections}
                  disabled={selSubmitting || (!selArtistId && !selConceptId)}
                  className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {selSubmitting ? "Gönderiliyor…" : "Seçimlerimi Gönder"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Konsept lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
          >
            <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                <Image src={lightbox.image_url} alt={lightbox.name} fill className="object-contain bg-black" unoptimized />
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-white font-medium">{lightbox.name}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setSelConceptId(lightbox.id); setLightbox(null); }}
                    className="px-4 py-2 rounded-full bg-white text-foreground text-xs font-medium hover:opacity-90"
                  >
                    Bu Konsepti Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightbox(null)}
                    className="px-4 py-2 rounded-full border border-white/40 text-white text-xs hover:border-white"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Çok seçenekli teklif — paket kartları */}
        {packages.length > 0 && (
          <div className="mb-8">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Size Özel Paketler</p>
              <p className="text-xs text-muted-foreground mt-1">
                {packagesLocked
                  ? "Sözleşme onaylandığı için paket değişikliği yapılamaz."
                  : "Etkinliğiniz için hazırladığımız seçenekler — size uyanı seçin, fiyat ve sözleşme buna göre güncellensin."}
              </p>
            </div>

            {pkgError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">{pkgError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {packages.map((pkg) => {
                const isSelected = selPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`rounded-2xl border-2 bg-white p-5 flex flex-col transition-all ${
                      isSelected ? "border-foreground" : "border-border"
                    }`}
                  >
                    {pkg.is_recommended && (
                      <span className="self-start text-[10px] uppercase tracking-wide font-medium px-2 py-1 rounded-full bg-foreground text-background mb-2">
                        Önerilen
                      </span>
                    )}
                    <p className="text-base font-semibold text-foreground">{pkg.title}</p>
                    {pkg.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{pkg.subtitle}</p>
                    )}
                    <p className="text-2xl font-semibold text-foreground tabular-nums mt-3">
                      {fmt(calcCashPrice(pkg.fee))}<Vat />
                    </p>
                    <p className="text-[10px] text-muted-foreground">peşin fiyat</p>

                    {pkg.lines.length > 0 && (
                      <ul className="mt-3 space-y-1.5 flex-1">
                        {pkg.lines.map((line, i) => (
                          <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                            <span className="text-foreground">•</span>
                            <span>
                              <span className="text-foreground">{line.title}</span>
                              {line.description && <span> — {line.description}</span>}
                              {line.amount ? <span className="tabular-nums"> ({fmt(line.amount)})</span> : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSelectPackage(pkg.id)}
                      disabled={packagesLocked || pkgPending !== null || isSelected}
                      className={`mt-4 w-full py-2.5 rounded-full text-xs font-medium transition-colors disabled:opacity-60 ${
                        isSelected
                          ? "bg-foreground text-background"
                          : "border border-border text-foreground hover:border-foreground/40"
                      }`}
                    >
                      {pkgPending === pkg.id ? "Seçiliyor…" : isSelected ? "✓ Seçtiğiniz paket" : "Bu Paketi Seç"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fiyat kartları — paketli teklifte önce paket seçilmeli */}
        {needsPackageChoice ? (
          <div className="rounded-2xl border border-border bg-white p-6 mb-8 text-center">
            <p className="text-sm font-medium text-foreground">Devam etmek için bir paket seçin</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Paketi seçtiğinizde ödeme seçenekleri ve sözleşme onayı burada açılır.
            </p>
          </div>
        ) : (
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
            <p className="text-2xl font-semibold text-foreground tabular-nums">{fmt(cashPrice)}<Vat /></p>
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
            <p className="text-2xl font-semibold text-foreground tabular-nums">{fmt(prepayPrice)}<Vat /></p>
            <p className="text-xs text-muted-foreground mt-2">
              {prepayAvailable
                ? <>Kapora (%{depositRate}): {fmt(prepayDeposit)}<Vat /> — kalan ödeme etkinlikten sonra en geç {FINAL_PAYMENT_GRACE_DAYS} gün içinde</>
                : `Etkinliğe ${daysLeft ?? 0} gün kaldığı için bu seçenek kapandı`}
            </p>
          </button>
        </div>
        )}

        {/* Şartlar */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <p className="text-sm font-semibold text-foreground mb-3">Rezervasyon Koşulları</p>
          <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <li>• Ön ödeme ile rezervasyon, etkinliğe en az {PREPAY_DEADLINE_DAYS} gün kalana kadar yapılabilir.</li>
            <li>• Kalan ödeme, etkinlik tarihinden sonra en geç {FINAL_PAYMENT_GRACE_DAYS} gün içinde tamamlanmalıdır.</li>
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

        {needsPackageChoice ? null : expired && !accepted ? (
          <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center">
            <p className="text-sm font-semibold text-foreground mb-1">Bu teklifin süresi doldu</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Güncel bir teklif almak için lütfen bizimle iletişime geçin — size en kısa sürede
              güncellenmiş bir teklif linki göndereceğiz.
            </p>
          </div>
        ) : !accepted ? (
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
                <strong className="text-foreground"> {fmt(agreedPrice)}<Vat /></strong> bedeli kabul ediyorum. Bu onay, taraflar arasında bağlayıcı bir sözleşme oluşturur
                {" "}(
                <a
                  href={`/api/teklif/${slug}/sozlesme`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`noqt-sozlesme-${slug}.pdf`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-foreground underline underline-offset-2 hover:text-foreground/80"
                >
                  sözleşmenin PDF&apos;ini indir
                </a>
                ).
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
              {selectedPlan === "cash" ? "Peşin" : "Ön ödemeli"} plan ile <strong className="text-foreground">{fmt(agreedPrice)}<Vat /></strong> tutarını kabul ettiniz.
              Sözleşmeniz PDF olarak e-posta adresinize gönderildi — dilerseniz{" "}
              <a
                href={`/api/teklif/${slug}/sozlesme`}
                target="_blank"
                rel="noopener noreferrer"
                download={`noqt-sozlesme-${slug}.pdf`}
                className="text-foreground underline underline-offset-2 hover:text-foreground/80"
              >
                buradan da indirebilirsiniz
              </a>.
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

                    {bankInfo && (
                      <div className="rounded-xl bg-secondary/50 border border-border p-4 mb-3 space-y-2.5">
                        {[
                          { key: "alici", label: "Alıcı", value: bankInfo.accountName },
                          ...(bankInfo.bankName ? [{ key: "banka", label: "Banka", value: bankInfo.bankName }] : []),
                          { key: "iban", label: "IBAN", value: bankInfo.iban, mono: true },
                          { key: "aciklama", label: "Açıklama", value: `NOQT-${String(booking.id).slice(0, 8).toUpperCase()}`, mono: true },
                        ].map((row) => (
                          <div key={row.key} className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[10px] tracking-wide uppercase text-muted-foreground">{row.label}</p>
                              <p className={`text-xs text-foreground truncate ${"mono" in row && row.mono ? "font-mono tracking-wide" : "font-medium"}`}>
                                {row.value}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(row.key, row.value)}
                              className={`shrink-0 text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                                copied === row.key
                                  ? "border-green-300 bg-green-50 text-green-700"
                                  : "border-border bg-white text-muted-foreground hover:text-foreground hover:border-foreground/40"
                              }`}
                            >
                              {copied === row.key ? "Kopyalandı ✓" : "Kopyala"}
                            </button>
                          </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground pt-1">
                          Havale açıklamasına yukarıdaki kodu yazmanız, ödemenizin rezervasyonunuzla anında eşleşmesini sağlar.
                        </p>
                      </div>
                    )}

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
