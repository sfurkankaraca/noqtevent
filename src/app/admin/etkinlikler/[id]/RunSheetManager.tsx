"use client";

import { useState } from "react";
import { type ScheduleItem } from "./types";

type Props = { projectId: string; initialSchedule: ScheduleItem[] };

export default function RunSheetManager({ projectId, initialSchedule }: Props) {
  const [items, setItems] = useState<ScheduleItem[]>(initialSchedule);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [newTime, setNewTime] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch(`/api/event-projects/${projectId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedTemplate: true }),
      });
      if (!res.ok) throw new Error("Şablon oluşturulamadı");
      const { items: created } = await res.json();
      setItems(created ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setSeeding(false);
    }
  };

  const patchItem = async (itemId: string, patch: Record<string, unknown>, revert: () => void) => {
    try {
      const res = await fetch(`/api/event-projects/${projectId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, ...patch }),
      });
      if (!res.ok) throw new Error("Güncellenemedi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      revert();
    }
  };

  const updateField = (item: ScheduleItem, field: "time" | "title" | "assigned_to" | "description", value: string) => {
    const prev = items;
    setItems((p) => p.map((it) => (it.id === item.id ? { ...it, [field]: value || (field === "time" || field === "title" ? value : null) } : it)));
    patchItem(item.id, { [field]: field === "assigned_to" || field === "description" ? value || null : value }, () => setItems(prev));
  };

  const handleDelete = async (itemId: string) => {
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== itemId));
    try {
      const res = await fetch(`/api/event-projects/${projectId}/schedule?itemId=${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      setItems(prev);
    }
  };

  const handleAdd = async () => {
    if (!newTime || !newTitle.trim()) return;
    try {
      const res = await fetch(`/api/event-projects/${projectId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: newTime, title: newTitle.trim(), assigned_to: newAssignee.trim() || null }),
      });
      if (!res.ok) throw new Error("Eklenemedi");
      const { item } = await res.json();
      setItems((p) => [...p, item]);
      setNewTime("");
      setNewTitle("");
      setNewAssignee("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    }
  };

  const inputCls = "px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40";

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Etkinlik Günü Planı</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Saat saat gün akışı — kim, ne zaman, ne yapacak. Proje dosyası PDF&apos;ine dahil edilir.
        </p>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      {sorted.length === 0 ? (
        <button onClick={handleSeed} disabled={seeding}
          className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {seeding ? "Oluşturuluyor…" : "Şablondan Gün Planı Oluştur"}
        </button>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((item) => (
            <div key={item.id} className="border border-border rounded-xl">
              <div className="flex items-center gap-2 px-3 py-2">
                <input type="time" value={item.time}
                  onChange={(e) => updateField(item, "time", e.target.value)}
                  className={`${inputCls} text-xs py-1 w-24 flex-shrink-0 tabular-nums`} />
                <button onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
                  className="flex-1 text-left text-sm text-foreground">
                  {item.title}
                </button>
                {item.assigned_to && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">{item.assigned_to}</span>
                )}
                <button onClick={() => handleDelete(item.id)}
                  className="text-muted-foreground hover:text-red-500 text-xs flex-shrink-0">×</button>
              </div>
              {openItem === item.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                  <input value={item.title}
                    onChange={(e) => updateField(item, "title", e.target.value)}
                    className={`${inputCls} w-full text-xs py-1.5`} placeholder="Başlık" />
                  <div className="flex gap-2">
                    <input value={item.assigned_to ?? ""}
                      onChange={(e) => updateField(item, "assigned_to", e.target.value)}
                      className={`${inputCls} flex-1 text-xs py-1.5`} placeholder="Sorumlu" />
                    <input value={item.description ?? ""}
                      onChange={(e) => updateField(item, "description", e.target.value)}
                      className={`${inputCls} flex-1 text-xs py-1.5`} placeholder="Not" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-border">
        <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
          className={`${inputCls} w-28 flex-shrink-0`} />
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Yeni adım…"
          className={`${inputCls} flex-1`} />
        <input value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} placeholder="Sorumlu"
          className={`${inputCls} w-28 flex-shrink-0`} />
        <button onClick={handleAdd} disabled={!newTime || !newTitle.trim()}
          className="text-xs px-3 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-50 flex-shrink-0">
          Ekle
        </button>
      </div>
    </div>
  );
}
