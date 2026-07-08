"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS, CATEGORY_ORDER, type ChecklistCategory } from "@/lib/checklistTemplate";

type ChecklistItem = {
  id: string;
  category: ChecklistCategory;
  title: string;
  description: string | null;
  is_done: boolean;
  assigned_to: string | null;
};

type Comment = { id: string; item_id: string; author_type: string; author_name: string | null; body: string };

export default function EventChecklistManager({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ChecklistCategory>("diger");
  const [newAssignee, setNewAssignee] = useState("");

  const load = async () => {
    const res = await fetch(`/api/event-projects/${projectId}/checklist`);
    if (!res.ok) throw new Error("Checklist yüklenemedi");
    const json = await res.json();
    setItems(json.items ?? []);
    setComments(json.comments ?? []);
  };

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Hata");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleToggle = async (item: ChecklistItem) => {
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_done: !it.is_done } : it)));
    try {
      const res = await fetch(`/api/event-projects/${projectId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, is_done: !item.is_done }),
      });
      if (!res.ok) throw new Error("Güncellenemedi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      reload();
    }
  };

  const handleAssigneeChange = async (item: ChecklistItem, assignee: string) => {
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, assigned_to: assignee } : it)));
    try {
      const res = await fetch(`/api/event-projects/${projectId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, assigned_to: assignee || null }),
      });
      if (!res.ok) throw new Error("Güncellenemedi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      reload();
    }
  };

  const handleDelete = async (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    try {
      const res = await fetch(`/api/event-projects/${projectId}/checklist?itemId=${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      reload();
    }
  };

  const handleAddItem = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`/api/event-projects/${projectId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory, title: newTitle.trim(), assigned_to: newAssignee.trim() || null }),
      });
      if (!res.ok) throw new Error("Eklenemedi");
      setNewTitle("");
      setNewAssignee("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    }
  };

  const handleAddComment = async (itemId: string) => {
    if (!commentDraft.trim()) return;
    try {
      const res = await fetch(`/api/event-projects/${projectId}/checklist/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, body: commentDraft.trim() }),
      });
      if (!res.ok) throw new Error("Yorum eklenemedi");
      setCommentDraft("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40";
  const doneCount = items.filter((i) => i.is_done).length;

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checklist & Görev Dağılımı</p>
        {items.length > 0 && <p className="text-xs text-muted-foreground">{doneCount} / {items.length} tamamlandı</p>}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bu etkinlik için checklist maddesi yok.</p>
      ) : (
        <div className="space-y-4">
          {CATEGORY_ORDER.filter((cat) => items.some((i) => i.category === cat)).map((cat) => (
            <div key={cat} className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">{CATEGORY_LABELS[cat]}</p>
              {items.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className="border border-border rounded-xl">
                  <div className="flex items-start gap-2 px-3 py-2">
                    <input type="checkbox" checked={item.is_done} onChange={() => handleToggle(item)}
                      className="mt-0.5 w-4 h-4 rounded border-border flex-shrink-0" />
                    <button onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
                      className={`flex-1 text-left text-sm ${item.is_done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.title}
                    </button>
                    <input value={item.assigned_to ?? ""} placeholder="Sorumlu"
                      onChange={(e) => handleAssigneeChange(item, e.target.value)}
                      className="w-28 text-xs px-2 py-1 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-foreground/40 flex-shrink-0" />
                    <button onClick={() => handleDelete(item.id)}
                      className="text-muted-foreground hover:text-red-500 text-xs flex-shrink-0">×</button>
                  </div>
                  {openItem === item.id && (
                    <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                      {comments.filter((c) => c.item_id === item.id).map((c) => (
                        <div key={c.id} className="text-xs">
                          <span className="font-medium text-foreground">{c.author_type === "admin" ? "NOQT" : c.author_name || "Müşteri"}: </span>
                          <span className="text-muted-foreground">{c.body}</span>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Yorum ekle…" className={`${inputCls} text-xs py-1.5`} />
                        <button onClick={() => handleAddComment(item.id)}
                          className="text-xs px-3 py-1.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors flex-shrink-0">
                          Ekle
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

      <div className="flex gap-2 pt-2 border-t border-border">
        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as ChecklistCategory)}
          className={`${inputCls} flex-shrink-0 w-36`}>
          {CATEGORY_ORDER.map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Yeni madde…" className={inputCls} />
        <input value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} placeholder="Sorumlu" className={`${inputCls} w-28 flex-shrink-0`} />
        <button onClick={handleAddItem} disabled={!newTitle.trim()}
          className="text-xs px-3 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-50 flex-shrink-0">
          Ekle
        </button>
      </div>
    </div>
  );
}
