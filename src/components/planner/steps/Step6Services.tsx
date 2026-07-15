"use client";

import { motion } from "framer-motion";
import { PARTNER_SERVICES, type PlannerData } from "../PlannerStore";

type Props = {
  data: PlannerData;
  update: (p: Partial<PlannerData>) => void;
  onNext: () => void;
};

const categories = [...new Set(PARTNER_SERVICES.map((s) => s.category))];

export default function Step6Services({ data, update, onNext }: Props) {
  const toggle = (id: string) => {
    const current = data.services;
    update({
      services: current.includes(id)
        ? current.filter((s) => s !== id)
        : [...current, id],
    });
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground leading-relaxed -mt-4">
        Yalnızca müzik değil — harika bir etkinliğin pek çok bileşeni var.
        Hangi hizmetlere ihtiyacın var?
      </p>

      {categories.map((cat, ci) => {
        const items = PARTNER_SERVICES.filter((s) => s.category === cat);
        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.05 }}
          >
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-3">
              {cat}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((svc) => {
                const selected = data.services.includes(svc.id);
                return (
                  <label
                    key={svc.id}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-all duration-150 ${
                      selected
                        ? "border-foreground bg-foreground/5"
                        : "border-border bg-transparent hover:border-foreground/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(svc.id)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all ${
                        selected ? "bg-foreground border-foreground" : "border-border"
                      }`}
                    >
                      {selected && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="var(--background)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="text-foreground">{svc.label}</span>
                  </label>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-2 flex items-center justify-between"
      >
        <button
          onClick={onNext}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Şimdilik geç →
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
        >
          {data.services.length > 0 ? `Devam (${data.services.length})` : "Devam"}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}
