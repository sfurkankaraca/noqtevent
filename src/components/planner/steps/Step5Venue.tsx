"use client";

import { useState } from "react";
import { VENUE_TYPES, type PlannerData } from "../PlannerStore";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  data: PlannerData;
  update: (p: Partial<PlannerData>) => void;
  onNext: () => void;
};

export default function Step5Venue({ data, update, onNext }: Props) {
  const [answered, setAnswered] = useState(data.hasVenue !== null);

  const selectYesNo = (has: boolean) => {
    update({ hasVenue: has });
    setAnswered(true);
    if (has) setTimeout(onNext, 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button
          onClick={() => selectYesNo(true)}
          className={`flex-1 py-5 rounded-2xl border-2 text-sm font-medium transition-all ${
            data.hasVenue === true
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-foreground hover:border-foreground/40"
          }`}
        >
          Evet, mekanım var
        </button>
        <button
          onClick={() => selectYesNo(false)}
          className={`flex-1 py-5 rounded-2xl border-2 text-sm font-medium transition-all ${
            data.hasVenue === false
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-foreground hover:border-foreground/40"
          }`}
        >
          Hayır, yardım istiyorum
        </button>
      </div>

      <AnimatePresence>
        {data.hasVenue === false && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">Hangi tip mekan hayal ediyorsun?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {VENUE_TYPES.map((vt) => {
                const selected = data.venueType === vt.id;
                return (
                  <button
                    key={vt.id}
                    onClick={() => update({ venueType: vt.id })}
                    className={`py-4 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-foreground hover:border-foreground/40"
                    }`}
                  >
                    {vt.label}
                  </button>
                );
              })}
            </div>

            {(data.venueType || data.hasVenue === false) && (
              <button
                onClick={onNext}
                className="mt-2 inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
              >
                Devam Et
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
