"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { GUEST_RANGES, BUDGET_LEVELS } from "@/lib/concierge";
import { submitLandingInfo } from "./actions";

type Props = {
  token: string;
  customerName: string | null;
  eventTypeLabel: string | null;
  knownDate: string | null;
  knownLocation: string | null;
  testimonials: { author: string; content: string; event: string | null; rating: number }[];
  artists: { id: string; name: string; photo: string | null }[];
};

const VENUE_OPTS = [
  { id: "var", label: "Mekanım belli" },
  { id: "yok", label: "Mekan arıyorum" },
] as const;

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full border-2 text-sm transition-all duration-200 hover:border-foreground/40 ${
        selected ? "border-foreground bg-foreground text-background font-medium" : "border-border bg-card text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function LandingClient({
  token, customerName, eventTypeLabel, knownDate, knownLocation, testimonials, artists,
}: Props) {
  const [form, setForm] = useState({
    event_date: knownDate ?? "",
    guest_range: "",
    budget_level: "",
    venue_status: "",
    location: knownLocation ?? "",
    phone: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("lead_landing_view", {});
  }, []);

  const firstName = customerName?.trim().split(/\s+/)[0] || null;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitLandingInfo({ token, ...form });
      trackEvent("lead_landing_submit", {});
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu, tekrar dener misiniz?");
    } finally {
      setSubmitting(false);
    }
  };

  const hasAnything =
    form.event_date !== (knownDate ?? "") || form.guest_range || form.budget_level ||
    form.venue_status || form.location !== (knownLocation ?? "") || form.phone || form.note;

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[oklch(0.975_0.006_80)]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="text-5xl mb-6">🙏</div>
          <h2 className="text-3xl text-foreground" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}>
            Teşekkürler{firstName ? `, ${firstName}` : ""}!
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Bilgileriniz ekibimize ulaştı. Size özel teklifimizle en kısa sürede döneceğiz.
          </p>
          <Link href="/sanatcilar" className="inline-block mt-8 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border">
            Bu arada sanatçı kadromuza göz atın →
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.975_0.006_80)]">
      <div className="max-w-2xl mx-auto px-6 py-12 lg:py-16 space-y-10">
        {/* Kişisel karşılama */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-4">NOQT · Etkinlik Tasarımı</p>
          <h1 className="text-3xl lg:text-4xl text-foreground leading-tight" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}>
            {firstName ? `Merhaba ${firstName},` : "Merhaba,"}
            <br />
            {eventTypeLabel ? `${eventTypeLabel.toLowerCase()} hazırlığınızı konuşalım.` : "etkinliğinizi birlikte tasarlayalım."}
          </h1>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Talebiniz elimizde. Size en doğru teklifi hazırlayabilmemiz için aşağıdaki birkaç
            soruyu yanıtlarsanız — 1 dakikanızı almaz — çok daha isabetli dönüş yapabiliriz.
          </p>
        </motion.div>

        {/* Mini form — hiçbir alan zorunlu değil */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl border border-border p-6 lg:p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Etkinlik tarihi</p>
            <input
              type="date"
              value={form.event_date}
              onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              className="w-full max-w-xs px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Kaç misafir bekliyorsunuz?</p>
            <div className="flex flex-wrap gap-2">
              {GUEST_RANGES.map((g) => (
                <Chip key={g.id} selected={form.guest_range === g.id} onClick={() => setForm((f) => ({ ...f, guest_range: f.guest_range === g.id ? "" : g.id }))}>
                  {g.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Bütçe yaklaşımınız</p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_LEVELS.map((b) => (
                <Chip key={b.id} selected={form.budget_level === b.id} onClick={() => setForm((f) => ({ ...f, budget_level: f.budget_level === b.id ? "" : b.id }))}>
                  {b.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Mekan durumu</p>
            <div className="flex flex-wrap gap-2">
              {VENUE_OPTS.map((v) => (
                <Chip key={v.id} selected={form.venue_status === v.id} onClick={() => setForm((f) => ({ ...f, venue_status: f.venue_status === v.id ? "" : v.id }))}>
                  {v.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Şehir / mekan</p>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Kayseri — Bağ evi"
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Telefon <span className="normal-case tracking-normal">(hızlı dönüş için)</span></p>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+90 5xx xxx xx xx"
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Eklemek istedikleriniz</p>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value.slice(0, 600) }))}
              rows={3}
              placeholder="Müzik zevkiniz, özel istekleriniz, aklınızdaki sorular…"
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-sm leading-relaxed focus:outline-none focus:border-foreground/40 transition-colors resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

          <button
            onClick={submit}
            disabled={submitting || !hasAnything}
            className={`w-full py-4 rounded-full text-sm font-medium tracking-wide transition-all ${
              !submitting && hasAnything ? "bg-foreground text-background hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {submitting ? "Gönderiliyor…" : "Bilgilerimi Gönder"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Bilgileriniz yalnızca teklifinizi hazırlamak için kullanılır, üçüncü kişilerle paylaşılmaz.
          </p>
        </motion.div>

        {/* Güven: sanatçılar */}
        {artists.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">Sahne alan sanatçılarımızdan</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {artists.map((a) => (
                <Link key={a.id} href={`/sanatcilar/${a.id}`} target="_blank" className="relative aspect-[3/4] rounded-xl overflow-hidden group block">
                  {a.photo ? (
                    <Image src={a.photo} alt={a.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute bottom-1.5 left-2 right-2 text-[10px] font-medium text-white leading-tight">{a.name}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Güven: yorumlar */}
        {testimonials.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Müşterilerimiz ne diyor</p>
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-5">
                <p className="text-sm text-foreground leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                <p className="text-xs text-muted-foreground mt-3">
                  {"★".repeat(Math.min(5, Math.max(1, t.rating)))} · {t.author}{t.event ? ` — ${t.event}` : ""}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-8">
          <Link href="/" className="hover:text-foreground transition-colors underline underline-offset-4 decoration-border">noqt.events</Link>
          {" "}· Kayseri & Nevşehir merkezli, Türkiye genelinde etkinlik tasarımı
        </p>
      </div>
    </div>
  );
}
