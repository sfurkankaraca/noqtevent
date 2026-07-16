"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveDj } from "./actions";

export default function ReorderButtons({ id, scopeTypes }: { id: string; scopeTypes?: string[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const move = (direction: "up" | "down") =>
    startTransition(async () => {
      const res = await moveDj(id, direction, scopeTypes);
      if (res.error) alert(res.error);
      else router.refresh();
    });

  const btnCls =
    "w-8 h-8 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40";

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => move("up")} disabled={pending} className={btnCls} title="Yukarı taşı">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
      </button>
      <button type="button" onClick={() => move("down")} disabled={pending} className={btnCls} title="Aşağı taşı">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
    </div>
  );
}
