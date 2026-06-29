"use client";

import { useTransition } from "react";
import { upsertMemoryEvent } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MemoryEventForm({ event }: { event?: Record<string, any> }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => upsertMemoryEvent(fd));
  }

  const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";
  const lbl = "block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {event?.id && <input type="hidden" name="id" value={event.id} />}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-medium text-foreground">Etkinlik Bilgileri</h2>

        <div>
          <label className={lbl}>Etkinlik Adı</label>
          <input name="title" required defaultValue={event?.title ?? ""} placeholder="Ayşe & Ali Düğünü" className={inp} />
        </div>

        <div>
          <label className={lbl}>URL (slug)</label>
          <input name="slug" required defaultValue={event?.slug ?? ""} placeholder="ayse-ali" className={inp} />
          <p className="text-xs text-muted-foreground mt-1">noqt.events/memory/ayse-ali</p>
        </div>

        <div>
          <label className={lbl}>Açıklama (isteğe bağlı)</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={event?.description ?? ""}
            placeholder="Fotoğraf ve videolarınızı bizimle paylaşın!"
            className={inp + " resize-none"}
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_active" defaultChecked={event?.is_active ?? true} className="w-4 h-4 rounded" />
          <span className="text-sm text-foreground">Aktif (misafirler yükleyebilir)</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
