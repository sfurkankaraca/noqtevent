"use client";

import { useState, useTransition } from "react";
import { generateOfferLink, sendOfferEmail } from "../actions";
import { calcCashPrice, calcPrepayPrice } from "@/lib/bookingTerms";

type Props = {
  bookingId: string;
  clientName: string;
  clientEmail: string | null;
  fee: number;
  initialSlug: string | null;
  paymentPlan: string | null;
};

export default function OfferManager({ bookingId, clientName, clientEmail, fee, initialSlug, paymentPlan }: Props) {
  const toSlug = (s: string) =>
    s.toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const [slug, setSlug] = useState(initialSlug ?? "");
  const [isPending, startTransition] = useTransition();
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.noqt.events";
  const offerUrl = slug ? `${origin}/teklif/${slug}` : null;

  const handleSave = () => {
    setError(null);
    const finalSlug = slug || toSlug(clientName + "-" + bookingId.slice(0, 6));
    setSlug(finalSlug);
    startTransition(async () => {
      try {
        await generateOfferLink(bookingId, finalSlug);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kayıt başarısız");
      }
    });
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await sendOfferEmail(bookingId);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 font-mono";

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Teklif & Ödeme Linki</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Peşin {calcCashPrice(fee).toLocaleString("tr-TR")} ₺ · Ön ödemeli {calcPrepayPrice(fee).toLocaleString("tr-TR")} ₺
          {paymentPlan && ` · Müşteri "${paymentPlan === "cash" ? "Peşin" : "Ön Ödemeli"}" planı onayladı`}
        </p>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">/teklif/</span>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="musteri-adi"
          className={`${inputCls} pl-[58px]`} />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={isPending}
          className="flex-1 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
          {isPending ? "Kaydediliyor…" : saved ? "✓ Kaydedildi" : "Kaydet"}
        </button>
        {offerUrl && (
          <a href={offerUrl} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            Aç ↗
          </a>
        )}
      </div>

      {slug && (
        <>
          <div className="flex gap-2">
            <a href={`/api/teklif/${slug}/pdf`} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Teklif PDF ↗
            </a>
            <a href={`/api/teklif/${slug}/sozlesme`} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sözleşme PDF ↗
            </a>
          </div>
          <button onClick={handleSend} disabled={sending || !clientEmail}
            className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {sending ? "Gönderiliyor…" : sent ? "✓ Tekrar Gönder" : "Müşteriye E-posta Gönder"}
          </button>
        </>
      )}
      {!clientEmail && <p className="text-xs text-muted-foreground">Müşteri e-postası yok, otomatik gönderim yapılamaz.</p>}
    </div>
  );
}
