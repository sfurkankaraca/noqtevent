"use client";

import { VENUE_TYPES, type PlannerData } from "../PlannerStore";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  data: PlannerData;
  update: (p: Partial<PlannerData>) => void;
  onNext: () => void;
};

export default function Step5Venue({ data, update, onNext }: Props) {
  const selectYesNo = (has: boolean) => {
    update({ hasVenue: has });
  };

  const canContinue = data.hasVenue !== null;

  return (
    <div className="space-y-6 max-w-lg">
      {/* Tahmini davetli sayısı — her zaman göster */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground tracking-wide font-medium">Tahmini davetli sayısı</label>
        <input
          type="number"
          min={1}
          value={data.guestCount}
          onChange={(e) => update({ guestCount: e.target.value })}
          placeholder="ör. 150"
          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
        />
      </div>

      {/* Mekan var mı? */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground tracking-wide font-medium">Mekanın var mı?</p>
        <div className="flex gap-4">
          <button
            onClick={() => selectYesNo(true)}
            className={`flex-1 py-4 rounded-2xl border-2 text-sm font-medium transition-all ${
              data.hasVenue === true
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground hover:border-foreground/40"
            }`}
          >
            Evet, mekanım var
          </button>
          <button
            onClick={() => selectYesNo(false)}
            className={`flex-1 py-4 rounded-2xl border-2 text-sm font-medium transition-all ${
              data.hasVenue === false
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground hover:border-foreground/40"
            }`}
          >
            Hayır, yardım istiyorum
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {data.hasVenue === true && (
          <motion.div
            key="has-venue"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="space-y-2"
          >
            <label className="text-xs text-muted-foreground tracking-wide font-medium">Mekan adı</label>
            <input
              type="text"
              value={data.venueName}
              onChange={(e) => update({ venueName: e.target.value })}
              placeholder="ör. Çırağan Palace, Villa Kalamış…"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
            />
          </motion.div>
        )}

        {data.hasVenue === false && (
          <motion.div
            key="no-venue"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">Hangi tip mekan hayal ediyorsun?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {VENUE_TYPES.map((vt) => (
                <button
                  key={vt.id}
                  onClick={() => update({ venueType: vt.id })}
                  className={`py-4 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    data.venueType === vt.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:border-foreground/40"
                  }`}
                >
                  {vt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {canContinue && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Devam Et
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      )}
    </div>
  );
}
