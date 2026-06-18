"use client";

import { GUEST_TYPES, type PlannerData } from "../PlannerStore";

type Props = {
  data: PlannerData;
  update: (p: Partial<PlannerData>) => void;
  onNext: () => void;
};

export default function Step3Guests({ data, update, onNext }: Props) {
  const select = (id: string) => {
    update({ guestType: id });
    setTimeout(onNext, 200);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {GUEST_TYPES.map((gt) => {
        const selected = data.guestType === gt.id;
        return (
          <button
            key={gt.id}
            onClick={() => select(gt.id)}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:border-foreground/40 ${
              selected
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors ${
                selected ? "bg-background border-background" : "border-border"
              }`}
            />
            <span className="text-sm font-medium">{gt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
