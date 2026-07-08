"use client";

import { useState, useTransition } from "react";
import { CATEGORY_LABELS, CATEGORY_ORDER, type ChecklistCategory } from "@/lib/checklistTemplate";
import { toggleItem, addComment } from "./actions";

type ChecklistItem = {
  id: string;
  category: ChecklistCategory;
  title: string;
  description: string | null;
  is_done: boolean;
};
type Comment = { id: string; item_id: string; author_type: string; author_name: string | null; body: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Booking = Record<string, any>;

export default function ChecklistView({
  token, booking, initialItems, initialComments,
}: {
  token: string;
  booking: Booking;
  initialItems: ChecklistItem[];
  initialComments: Comment[];
}) {
  const [items, setItems] = useState(initialItems);
  const [comments, setComments] = useState(initialComments);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [name, setName] = useState(booking.client_name ?? "");
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const doneCount = items.filter((i) => i.is_done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const handleToggle = (item: ChecklistItem) => {
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_done: !it.is_done } : it)));
    startTransition(async () => {
      try {
        await toggleItem(token, item.id, !item.is_done);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hata");
      }
    });
  };

  const handleAddComment = (itemId: string) => {
    if (!draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    startTransition(async () => {
      try {
        await addComment(token, itemId, name, body);
        setComments((prev) => [...prev, { id: `tmp-${Date.now()}`, item_id: itemId, author_type: "client", author_name: name, body }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hata");
      }
    });
  };

  const eventDateStr = booking.event_date
    ? new Date(booking.event_date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-secondary/10 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">NOQT · Etkinlik Planlaması</p>
          <h1 className="text-2xl font-semibold text-foreground">{booking.client_name}</h1>
          {eventDateStr && <p className="text-sm text-muted-foreground">{eventDateStr}</p>}
          {booking.venue_name && <p className="text-sm text-muted-foreground">{booking.venue_name}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">İlerleme</p>
            <p className="text-sm text-muted-foreground">{doneCount} / {items.length}</p>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-5 text-center text-sm text-muted-foreground">
            Henüz bir planlama listesi oluşturulmadı. NOQT ekibi kısa süre içinde ekleyecek.
          </div>
        ) : (
          <div className="space-y-5">
            {CATEGORY_ORDER.filter((cat) => items.some((i) => i.category === cat)).map((cat) => (
              <div key={cat} className="bg-white rounded-2xl border border-border p-5 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{CATEGORY_LABELS[cat]}</p>
                {items.filter((i) => i.category === cat).map((item) => (
                  <div key={item.id} className="border border-border rounded-xl">
                    <div className="flex items-start gap-3 px-3 py-2.5">
                      <input type="checkbox" checked={item.is_done} onChange={() => handleToggle(item)}
                        disabled={isPending}
                        className="mt-0.5 w-4 h-4 rounded border-border flex-shrink-0" />
                      <button onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
                        className={`flex-1 text-left text-sm ${item.is_done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {item.title}
                      </button>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {comments.filter((c) => c.item_id === item.id).length > 0 &&
                          `💬 ${comments.filter((c) => c.item_id === item.id).length}`}
                      </span>
                    </div>
                    {openItem === item.id && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        {comments.filter((c) => c.item_id === item.id).map((c) => (
                          <div key={c.id} className="text-xs">
                            <span className="font-medium text-foreground">{c.author_type === "admin" ? "NOQT" : c.author_name || "Siz"}: </span>
                            <span className="text-muted-foreground">{c.body}</span>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <input value={name} onChange={(e) => setName(e.target.value)}
                            placeholder="İsminiz"
                            className="w-24 px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:border-foreground/40 flex-shrink-0" />
                          <input value={draft} onChange={(e) => setDraft(e.target.value)}
                            placeholder="Yorum ekle…"
                            className="flex-1 px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:border-foreground/40" />
                          <button onClick={() => handleAddComment(item.id)} disabled={isPending || !draft.trim()}
                            className="text-xs px-3 py-1.5 rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50 flex-shrink-0">
                            Gönder
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
