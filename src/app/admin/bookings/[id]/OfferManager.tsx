"use client";

import { useState, useTransition } from "react";
import { generateOfferLink, sendOfferEmail, updateOfferOptions } from "../actions";
import { calcCashPrice, calcPrepayPrice } from "@/lib/bookingTerms";

const CONCEPT_CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "— Konsept gösterme —" },
  { value: "nisan", label: "Nişan" },
  { value: "evde-nisan", label: "Evde Nişan" },
  { value: "evlilik-teklifi", label: "Evlilik Teklifi" },
  { value: "kurumsal", label: "Kurumsal Etkinlik" },
];

type Props = {
  bookingId: string;
  clientName: string;
  clientEmail: string | null;
  fee: number;
  prepayMarkupRate: number;
  initialSlug: string | null;
  paymentPlan: string | null;
  artists?: { id: string; name: string; performer_type: string | null }[];
  initialArtistIds?: string[];
  initialConceptCategory?: string | null;
  selection?: { artistName: string | null; conceptName: string | null; note: string | null; at: string | null } | null;
};

export default function OfferManager({
  bookingId, clientName, clientEmail, fee, prepayMarkupRate, initialSlug, paymentPlan,
  artists = [], initialArtistIds = [], initialConceptCategory = null, selection = null,
}: Props) {
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
  const [showOptions, setShowOptions] = useState(false);
  const [artistIds, setArtistIds] = useState<string[]>(initialArtistIds);
  const [conceptCategory, setConceptCategory] = useState(initialConceptCategory ?? "");
  const [optionsSaved, setOptionsSaved] = useState(false);

  const toggleArtist = (id: string) => {
    setArtistIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const handleSaveOptions = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateOfferOptions(bookingId, { artistIds, conceptCategory: conceptCategory || null });
        setOptionsSaved(true);
        setTimeout(() => setOptionsSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kayıt başarısız");
      }
    });
  };

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
          Peşin {calcCashPrice(fee).toLocaleString("tr-TR")} ₺ · Ön ödemeli (%{prepayMarkupRate}) {calcPrepayPrice(fee, prepayMarkupRate).toLocaleString("tr-TR")} ₺
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

      {/* Teklif seçenekleri: müşteriye sunulacak sanatçı adayları + konsept kategorisi */}
      <div className="border-t border-border pt-3">
        <button onClick={() => setShowOptions((p) => !p)}
          className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors">
          <span>Teklif Seçenekleri (sanatçı & konsept)</span>
          <span>{showOptions ? "−" : "+"}</span>
        </button>

        {selection?.at && (
          <div className="mt-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800 space-y-0.5">
            <p className="font-medium">✓ Müşteri tercihini gönderdi ({new Date(selection.at).toLocaleDateString("tr-TR")})</p>
            {selection.artistName && <p>Sanatçı: {selection.artistName}</p>}
            {selection.conceptName && <p>Konsept: {selection.conceptName}</p>}
            {selection.note && <p>Not: {selection.note}</p>}
          </div>
        )}

        {showOptions && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Sanatçı adayları (müşteri portfolyolarını görüp seçebilir)</p>
              <div className="max-h-44 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {artists.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3">Aktif sanatçı bulunamadı.</p>
                ) : (
                  artists.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <input type="checkbox" checked={artistIds.includes(a.id)} onChange={() => toggleArtist(a.id)}
                        className="w-4 h-4 rounded border-border" />
                      <span className="text-sm text-foreground flex-1">{a.name}</span>
                      {a.performer_type && <span className="text-xs text-muted-foreground">{a.performer_type}</span>}
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Konsept görselleri kategorisi</p>
              <select value={conceptCategory} onChange={(e) => setConceptCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40">
                {CONCEPT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <button onClick={handleSaveOptions} disabled={isPending}
              className="w-full py-2 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
              {isPending ? "Kaydediliyor…" : optionsSaved ? "✓ Kaydedildi" : "Seçenekleri Kaydet"}
            </button>
            <p className="text-xs text-muted-foreground">
              Seçilen sanatçılar teklif sayfasında portfolyo kartlarıyla, konsept kategorisi de görsel seçenekler olarak müşteriye sunulur.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
