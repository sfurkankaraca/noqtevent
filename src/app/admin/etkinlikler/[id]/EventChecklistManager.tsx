"use client";

import { useState } from "react";
import { CATEGORY_LABELS, CATEGORY_ORDER, type ChecklistCategory } from "@/lib/checklistTemplate";
import { type ChecklistItem, type ChecklistComment, dueStatus, fmtDate } from "./types";

type Props = {
  projectId: string;
  items: ChecklistItem[];
  setItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  initialComments: ChecklistComment[];
};

export default function EventChecklistManager({ projectId, items, setItems, initialComments }: Props) {
  const [comments, setComments] = useState<ChecklistComment[]>(initialComments);
  const [error, setError] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [groupBy, setGroupBy] = useState<"category" | "assignee">("category");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ChecklistCategory>("diger");
  const [newAssignee, setNewAssignee] = useState("");

  const patchItem = async (itemId: string, patch: Record<string, unknown>, revert: () => void) => {
    try {
      const res = await fetch(`/api/event-projects/${projectId}/checklist`, {
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

  const handleToggle = (item: ChecklistItem) => {
    const prev = items;
    setItems((p) => p.map((it) => (it.id === item.id ? { ...it, is_done: !it.is_done } : it)));
    patchItem(item.id, { is_done: !item.is_done }, () => setItems(prev));
  };

  const handleAssigneeChange = (item: ChecklistItem, assignee: string) => {
    const prev = items;
    setItems((p) => p.map((it) => (it.id === item.id ? { ...it, assigned_to: assignee } : it)));
    patchItem(item.id, { assigned_to: assignee || null }, () => setItems(prev));
  };

  const handleDueDateChange = (item: ChecklistItem, dueDate: string) => {
    const prev = items;
    setItems((p) => p.map((it) => (it.id === item.id ? { ...it, due_date: dueDate || null } : it)));
    patchItem(item.id, { due_date: dueDate || null }, () => setItems(prev));
  };

  const handleDelete = async (itemId: string) => {
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== itemId));
    try {
      const res = await fetch(`/api/event-projects/${projectId}/checklist?itemId=${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      setItems(prev);
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
      const { item } = await res.json();
      setItems((p) => [...p, item]);
      setNewTitle("");
      setNewAssignee("");
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
      const { comment } = await res.json();
      setComments((p) => [...p, comment]);
      setCommentDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40";
  const doneCount = items.filter((i) => i.is_done).length;

  // Gruplama: kategori sırasına göre ya da sorumluya göre
  const groups: { key: string; label: string; groupItems: ChecklistItem[] }[] =
    groupBy === "category"
      ? CATEGORY_ORDER.filter((cat) => items.some((i) => i.category === cat)).map((cat) => ({
          key: cat,
          label: CATEGORY_LABELS[cat],
          groupItems: items.filter((i) => i.category === cat),
        }))
      : [...new Set(items.map((i) => i.assigned_to || ""))]
          .sort((a, b) => (a || "zz").localeCompare(b || "zz", "tr"))
          .map((assignee) => {
            const groupItems = items.filter((i) => (i.assigned_to || "") === assignee);
            const overdue = groupItems.filter((i) => dueStatus(i) === "overdue").length;
            return {
              key: assignee || "_unassigned",
              label: `${assignee || "Atanmamış"} — ${groupItems.filter((i) => i.is_done).length}/${groupItems.length} görev${overdue ? `, ${overdue} gecikmiş` : ""}`,
              groupItems,
            };
          });

  const renderItem = (item: ChecklistItem) => {
    const status = dueStatus(item);
    return (
      <div key={item.id} className={`border rounded-xl ${
        status === "overdue" ? "border-red-300 bg-red-50/40" :
        status === "soon" ? "border-amber-300 bg-amber-50/40" : "border-border"
      }`}>
        <div className="flex items-center gap-2 px-3 py-2">
          <input type="checkbox" checked={item.is_done} onChange={() => handleToggle(item)}
            className="w-4 h-4 rounded border-border flex-shrink-0" />
          <button onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
            className={`flex-1 text-left text-sm ${item.is_done ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {item.title}
          </button>
          {item.due_date && !item.is_done && (
            <span className={`text-xs flex-shrink-0 ${
              status === "overdue" ? "text-red-600 font-medium" :
              status === "soon" ? "text-amber-600 font-medium" : "text-muted-foreground"
            }`}>
              {fmtDate(item.due_date)}
            </span>
          )}
          <button onClick={() => handleDelete(item.id)}
            className="text-muted-foreground hover:text-red-500 text-xs flex-shrink-0">×</button>
        </div>
        {openItem === item.id && (
          <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Sorumlu</p>
                <input value={item.assigned_to ?? ""} placeholder="İsim/e-posta"
                  onChange={(e) => handleAssigneeChange(item, e.target.value)}
                  className={`${inputCls} text-xs py-1.5`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Son tarih</p>
                <input type="date" value={item.due_date ?? ""}
                  onChange={(e) => handleDueDateChange(item, e.target.value)}
                  className={`${inputCls} text-xs py-1.5`} />
              </div>
            </div>
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
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Görevler & Dağılım</p>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-border overflow-hidden text-xs">
            <button onClick={() => setGroupBy("category")}
              className={`px-3 py-1.5 transition-colors ${groupBy === "category" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              Kategoriye göre
            </button>
            <button onClick={() => setGroupBy("assignee")}
              className={`px-3 py-1.5 transition-colors ${groupBy === "assignee" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              Kişiye göre
            </button>
          </div>
          {items.length > 0 && <p className="text-xs text-muted-foreground">{doneCount} / {items.length}</p>}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bu etkinlik için görev yok.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key} className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">{g.label}</p>
              {g.groupItems.map(renderItem)}
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
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Yeni görev…" className={inputCls} />
        <input value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} placeholder="Sorumlu" className={`${inputCls} w-28 flex-shrink-0`} />
        <button onClick={handleAddItem} disabled={!newTitle.trim()}
          className="text-xs px-3 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-50 flex-shrink-0">
          Ekle
        </button>
      </div>
    </div>
  );
}
