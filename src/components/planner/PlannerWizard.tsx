"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  initialData,
  type PlannerData,
} from "./PlannerStore";
import Step1EventType from "./steps/Step1EventType";
import Step2Guests from "./steps/Step3Guests";
import Step3EventSections from "./steps/StepEventSections";
import Step4Moments from "./steps/StepMoments";
import Step5Venue from "./steps/Step5Venue";
import Step6Services from "./steps/Step6Services";
import Step7Recommendations from "./steps/Step9Recommendations";
import Step8Contact from "./steps/Step10Contact";

const TOTAL_STEPS = 8;

const stepTitles = [
  "Ne planlıyorsun?",
  "Misafirlerin kim?",
  "Gecenin müzik konseptlerine karar verelim",
  "Önemli anlarını planla",
  "Mekanın var mı?",
  "Hangi alanlarda rehberlik ister misin?",
  "Senin için hazırladık",
  "Deneyim taslağın hazır",
];

export default function PlannerWizard({ conceptCovers = {} }: { conceptCovers?: Record<string, string> }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<PlannerData>(initialData);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [availabilityWarning, setAvailabilityWarning] = useState(false);

  const update = (partial: Partial<PlannerData>) =>
    setData((d) => ({ ...d, ...partial }));

  const next = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -48 : 48 }),
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[oklch(0.975_0.006_80)]">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-5xl mb-6">🎉</div>
          <h2
            className="text-3xl text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Mükemmel!
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Deneyim taslağın oluşturuldu. En kısa sürede seninle iletişime
            geçeceğiz, {data.name}.
          </p>
          {availabilityWarning && (
            <div className="mt-5 bg-[oklch(0.94_0.03_60)] border border-[oklch(0.85_0.06_60)] rounded-2xl px-5 py-4 text-sm text-[oklch(0.4_0.05_60)] leading-relaxed">
              Belirttiğin tarihte müsaitliğimiz sınırlı görünüyor. Sana en kısa sürede ulaşıp alternatif seçenekleri birlikte değerlendireceğiz.
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            {data.email} adresine bir özet gönderdik.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.975_0.006_80)] flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border">
        <motion.div
          className="h-full bg-foreground"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <div className="pt-8 pb-6 px-6 lg:px-8 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button
          onClick={prev}
          className={`text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 ${
            step === 1 ? "invisible" : ""
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Geri
        </button>
        <span className="text-xs text-muted-foreground tracking-[0.2em]">
          {step} / {TOTAL_STEPS}
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 lg:px-8 pb-12">
        {/* Step label */}
        <motion.p
          key={`label-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-4"
        >
          Adım {step}
        </motion.p>

        {/* Step title */}
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

        {/* Animated step body */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1"
          >
            {step === 1 && (
              <Step1EventType data={data} update={update} onNext={next} />
            )}
            {step === 2 && (
              <Step2Guests data={data} update={update} onNext={next} />
            )}
            {step === 3 && (
              <Step3EventSections data={data} update={update} onNext={next} conceptCovers={conceptCovers} />
            )}
            {step === 4 && (
              <Step4Moments data={data} update={update} onNext={next} />
            )}
            {step === 5 && (
              <Step5Venue data={data} update={update} onNext={next} />
            )}
            {step === 6 && (
              <Step6Services data={data} update={update} onNext={next} />
            )}
            {step === 7 && (
              <Step7Recommendations data={data} onNext={next} />
            )}
            {step === 8 && (
              <Step8Contact
                data={data}
                update={update}
                onSubmit={(warning?: boolean) => {
                  if (warning) setAvailabilityWarning(true);
                  setSubmitted(true);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
