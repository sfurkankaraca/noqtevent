"use client";

import { EVENT_TYPES, type PlannerData } from "../PlannerStore";

type Props = {
  data: PlannerData;
  update: (p: Partial<PlannerData>) => void;
  onNext: () => void;
};

export default function Step1EventType({ data, update, onNext }: Props) {
  const select = (id: string) => {
    update({ eventType: id });
    setTimeout(onNext, 200);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {EVENT_TYPES.map((type) => {
        const selected = data.eventType === type.id;
        return (
          <button
            key={type.id}
            onClick={() => select(type.id)}
            className={`flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:border-foreground/40 ${
              selected
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground"
            }`}
          >
            <span className="text-2xl">{type.emoji}</span>
            <span className="text-sm font-medium leading-snug">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}
