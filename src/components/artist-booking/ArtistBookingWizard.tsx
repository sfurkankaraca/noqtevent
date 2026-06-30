"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { submitArtistBooking } from "@/app/sanatcilar/rezervasyon/actions";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";

export type ArtistBookingData = {
  artistId: string;
  artistName: string;
  // Step 1
  eventType: string;
  eventDate: string;
  city: string;
  venueName: string;
  venueCapacity: string;
  // Step 2
  setDuration: string;
  doorOpenTime: string;
  stageTime: string;
  curfew: string;
  otherPerformers: string;
  // Step 3
  mixerModel: string;
  cdjModel: string;
  soundSystem: string;
  hasMonitor: string;
  // Step 4
  budget: string;
  accommodation: string;
  transfer: string;
  // Step 5
  name: string;
  surname: string;
  company: string;
  phone: string;
  email: string;
  specialRequests: string;
};

const TOTAL_STEPS = 5;

const stepTitles = [
  "Etkinlik bilgileri",
  "Performans detayları",
  "Teknik ekipman",
  "Bütçe",
  "İletişim bilgileri",
];

// ── Shared UI ─────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function OptionGrid({
  options,
  value,
  onChange,
  cols = 3,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  cols?: 2 | 3;
}) {
  return (
    <div className={`grid gap-2.5 ${cols === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {options.map((opt) => {
        const sel = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all text-left ${
              sel
                ? "bg-foreground text-background border-foreground"
                : "border-border text-foreground hover:border-foreground/40"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function YesNo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      {[
        { id: "yes", label: "Evet" },
        { id: "no", label: "Hayır" },
      ].map((opt) => {
        const sel = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(sel ? "" : opt.id)}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              sel
                ? "bg-foreground text-background border-foreground"
                : "border-border text-foreground hover:border-foreground/40"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function NextBtn({ onClick, disabled, label = "Devam →" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-2 w-full bg-foreground text-background py-3.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
    >
      {label}
    </button>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function Step1Event({
  data,
  update,
  artistName,
  onNext,
}: {
  data: ArtistBookingData;
  update: (p: Partial<ArtistBookingData>) => void;
  artistName: string;
  onNext: () => void;
}) {
  const eventTypeOptions = Object.entries(EVENT_TYPE_LABELS)
    .filter(([id]) => id !== "sunset")
    .map(([id, label]) => ({ id, label }));

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3 bg-white rounded-xl border border-border px-4 py-3">
        <div className="w-2 h-2 rounded-full bg-foreground flex-shrink-0" />
        <p className="text-sm text-foreground">
          <span className="text-muted-foreground">Sanatçı: </span>
          <strong>{artistName}</strong>
        </p>
      </div>

      <Field label="Etkinlik Türü">
        <OptionGrid options={eventTypeOptions} value={data.eventType} onChange={(v) => update({ eventType: v })} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Etkinlik Tarihi">
          <input
            type="date"
            className={inputCls}
            value={data.eventDate}
            onChange={(e) => update({ eventDate: e.target.value })}
            min={new Date().toISOString().split("T")[0]}
          />
        </Field>
        <Field label="Şehir">
          <input
            type="text"
            className={inputCls}
            placeholder="Kayseri"
            value={data.city}
            onChange={(e) => update({ city: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Mekân Adı" hint="Opsiyonel">
          <input
            type="text"
            className={inputCls}
            placeholder="Venue adı"
            value={data.venueName}
            onChange={(e) => update({ venueName: e.target.value })}
          />
        </Field>
        <Field label="Tahmini Kapasite">
          <select
            className={inputCls}
            value={data.venueCapacity}
            onChange={(e) => update({ venueCapacity: e.target.value })}
          >
            <option value="">Seçin</option>
            {["100'den az", "100 – 300", "300 – 500", "500 – 1.000", "1.000+"].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <NextBtn onClick={onNext} disabled={!data.eventType} />
    </div>
  );
}

function Step2Performance({
  data,
  update,
  onNext,
}: {
  data: ArtistBookingData;
  update: (p: Partial<ArtistBookingData>) => void;
  onNext: () => void;
}) {
  const durations = [
    { id: "1h", label: "1 saat" },
    { id: "1.5h", label: "1.5 saat" },
    { id: "2h", label: "2 saat" },
    { id: "3h", label: "3 saat" },
    { id: "4h+", label: "4+ saat" },
    { id: "tbd", label: "Görüşülecek" },
  ];

  return (
    <div className="space-y-7">
      <Field label="Talep Edilen Set Süresi">
        <OptionGrid options={durations} value={data.setDuration} onChange={(v) => update({ setDuration: v })} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Field label="Kapı Açılış" hint="Opsiyonel">
          <input
            type="text"
            className={inputCls}
            placeholder="22:00"
            value={data.doorOpenTime}
            onChange={(e) => update({ doorOpenTime: e.target.value })}
          />
        </Field>
        <Field label="Sahne Saati" hint="Opsiyonel">
          <input
            type="text"
            className={inputCls}
            placeholder="00:00"
            value={data.stageTime}
            onChange={(e) => update({ stageTime: e.target.value })}
          />
        </Field>
        <Field label="Bitiş / Curfew" hint="Opsiyonel">
          <input
            type="text"
            className={inputCls}
            placeholder="03:00"
            value={data.curfew}
            onChange={(e) => update({ curfew: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Diğer Sanatçılar" hint="Opsiyonel — sahne paylaşacak diğer isimler">
        <input
          type="text"
          className={inputCls}
          placeholder="Ön DJ, kapanış sanatçısı..."
          value={data.otherPerformers}
          onChange={(e) => update({ otherPerformers: e.target.value })}
        />
      </Field>

      <NextBtn onClick={onNext} disabled={!data.setDuration} />
    </div>
  );
}

function Step3Technical({
  data,
  update,
  onNext,
}: {
  data: ArtistBookingData;
  update: (p: Partial<ArtistBookingData>) => void;
  onNext: () => void;
}) {
  const mixerOptions = [
    "Pioneer DJM-900NXS2",
    "Pioneer DJM-V10",
    "Rane MP2015",
    "Allen & Heath Xone:96",
    "Diğer",
    "Bilmiyorum",
  ];
  const cdjOptions = [
    "Pioneer CDJ-2000NXS2",
    "Pioneer CDJ-3000",
    "Denon SC6000",
    "Rekordbox (laptop)",
    "Serato DJ (laptop)",
    "Diğer",
    "Bilmiyorum",
  ];

  function EquipmentGrid({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const sel = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(sel ? "" : opt)}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                sel
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-foreground hover:border-foreground/40"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <Field label="Mikser" hint="Mevcut ekipman">
        <EquipmentGrid options={mixerOptions} value={data.mixerModel} onChange={(v) => update({ mixerModel: v })} />
      </Field>

      <Field label="CDJ / Media Player" hint="Mevcut ekipman">
        <EquipmentGrid options={cdjOptions} value={data.cdjModel} onChange={(v) => update({ cdjModel: v })} />
      </Field>

      <Field label="Ses Sistemi" hint="Opsiyonel">
        <input
          type="text"
          className={inputCls}
          placeholder="QSC, L-Acoustics, D&B..."
          value={data.soundSystem}
          onChange={(e) => update({ soundSystem: e.target.value })}
        />
      </Field>

      <Field label="Monitör Mevcut mu?">
        <YesNo value={data.hasMonitor} onChange={(v) => update({ hasMonitor: v })} />
      </Field>

      <NextBtn onClick={onNext} />
    </div>
  );
}

function Step4Budget({
  data,
  update,
  onNext,
}: {
  data: ArtistBookingData;
  update: (p: Partial<ArtistBookingData>) => void;
  onNext: () => void;
}) {
  const budgets = [
    { id: "10-25k", label: "10.000 – 25.000 ₺" },
    { id: "25-50k", label: "25.000 – 50.000 ₺" },
    { id: "50-100k", label: "50.000 – 100.000 ₺" },
    { id: "100k+", label: "100.000 ₺ ve üzeri" },
    { id: "open", label: "Görüşmeye açık" },
  ];

  return (
    <div className="space-y-7">
      <Field label="Etkinlik İçin Ayrılan Bütçe">
        <OptionGrid options={budgets} value={data.budget} onChange={(v) => update({ budget: v })} cols={2} />
      </Field>

      <Field label="Konaklama Dahil mi?">
        <YesNo value={data.accommodation} onChange={(v) => update({ accommodation: v })} />
      </Field>

      <Field label="Transfer Dahil mi?">
        <YesNo value={data.transfer} onChange={(v) => update({ transfer: v })} />
      </Field>

      <NextBtn onClick={onNext} disabled={!data.budget} />
    </div>
  );
}

function Step5Contact({
  data,
  update,
  onSubmit,
  isSubmitting,
}: {
  data: ArtistBookingData;
  update: (p: Partial<ArtistBookingData>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const valid = data.name && data.surname && data.phone && data.email;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ad">
          <input
            type="text"
            className={inputCls}
            placeholder="Ad"
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </Field>
        <Field label="Soyad">
          <input
            type="text"
            className={inputCls}
            placeholder="Soyad"
            value={data.surname}
            onChange={(e) => update({ surname: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Şirket / Organizasyon" hint="Opsiyonel">
        <input
          type="text"
          className={inputCls}
          placeholder="Şirket veya organizasyon adı"
          value={data.company}
          onChange={(e) => update({ company: e.target.value })}
        />
      </Field>

      <Field label="Telefon">
        <input
          type="tel"
          className={inputCls}
          placeholder="+90 5xx xxx xx xx"
          value={data.phone}
          onChange={(e) => update({ phone: e.target.value })}
        />
      </Field>

      <Field label="E-posta">
        <input
          type="email"
          className={inputCls}
          placeholder="email@ornek.com"
          value={data.email}
          onChange={(e) => update({ email: e.target.value })}
        />
      </Field>

      <Field label="Özel Talepler" hint="Opsiyonel">
        <textarea
          className={inputCls + " resize-none"}
          rows={3}
          placeholder="Rider, teknik gereksinimler, özel notlar..."
          value={data.specialRequests}
          onChange={(e) => update({ specialRequests: e.target.value })}
        />
      </Field>

      <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/60 rounded-xl px-4 py-3">
        Bu form rezervasyonun kesinleştiği anlamına gelmez. Müsaitlik durumu, sanatçı onayı ve gerekli ön ödemeye bağlıdır.
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!valid || isSubmitting}
        className="w-full bg-foreground text-background py-3.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {isSubmitting ? "Gönderiliyor…" : "Ön Değerlendirme Talebi Gönder"}
      </button>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

function makeInitial(artistId: string, artistName: string): ArtistBookingData {
  return {
    artistId, artistName,
    eventType: "", eventDate: "", city: "", venueName: "", venueCapacity: "",
    setDuration: "", doorOpenTime: "", stageTime: "", curfew: "", otherPerformers: "",
    mixerModel: "", cdjModel: "", soundSystem: "", hasMonitor: "",
    budget: "", accommodation: "", transfer: "",
    name: "", surname: "", company: "", phone: "", email: "", specialRequests: "",
  };
}

export default function ArtistBookingWizard({
  artistId,
  artistName,
  onClose,
}: {
  artistId: string;
  artistName: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ArtistBookingData>(() => makeInitial(artistId, artistName));
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (partial: Partial<ArtistBookingData>) => setData((d) => ({ ...d, ...partial }));

  const next = () => {
    setDirection(1);
    setStep((s) => {
      const target = Math.min(s + 1, TOTAL_STEPS);
      if (target !== s) trackEvent("artist_booking_step", { step: target, artistName });
      return target;
    });
  };

  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitArtistBooking(data);
      trackEvent("artist_booking_submit", { artistName, eventType: data.eventType });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -48 : 48 }),
  };

  if (submitted) {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-[oklch(0.975_0.006_80)] flex items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md w-full">
          <div className="text-5xl mb-6">🎉</div>
          <h2
            className="text-3xl text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Talebiniz alındı!
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            <strong>{artistName}</strong> için ön değerlendirme talebiniz iletildi. NOQT ekibi müsaitlik durumunu kontrol ederek en kısa sürede sizinle iletişime geçecek.
          </p>
          <p className="text-sm text-muted-foreground mt-3">{data.email} adresine bilgi maili gönderildi.</p>
          <button
            onClick={onClose}
            className="mt-8 w-full bg-foreground text-background py-3.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Kapat
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[oklch(0.975_0.006_80)] flex flex-col overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border">
        <motion.div
          className="h-full bg-foreground"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <div className="pt-8 pb-4 px-6 lg:px-8 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button
          onClick={prev}
          className={`text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 ${step === 1 ? "invisible" : ""}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Geri
        </button>
        <span className="text-xs text-muted-foreground tracking-[0.2em]">
          {step} / {TOTAL_STEPS}
        </span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Kapat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 lg:px-8 pb-16">
        <motion.p
          key={`label-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-4"
        >
          Adım {step}
        </motion.p>
        <motion.h1
          key={`title-${step}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl lg:text-4xl text-foreground mb-10"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          {stepTitles[step - 1]}
        </motion.h1>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 1 && <Step1Event data={data} update={update} artistName={artistName} onNext={next} />}
            {step === 2 && <Step2Performance data={data} update={update} onNext={next} />}
            {step === 3 && <Step3Technical data={data} update={update} onNext={next} />}
            {step === 4 && <Step4Budget data={data} update={update} onNext={next} />}
            {step === 5 && <Step5Contact data={data} update={update} onSubmit={handleSubmit} isSubmitting={isSubmitting} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
