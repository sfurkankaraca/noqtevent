"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS, CATEGORY_ORDER, type ChecklistCategory } from "@/lib/checklistTemplate";

type ChecklistItem = {
  id: string;
  category: ChecklistCategory;
  title: string;
  description: string | null;
  is_done: boolean;
  done_by: string | null;
};

type Comment = { id: string; item_id: string; author_type: string; author_name: string | null; body: string; created_at: string };

export default function ChecklistManager({ bookingId, clientName }: { bookingId: string; clientName: string }) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ChecklistCategory>("diger");

  const load = async () => {
    const res = await fetch(`/api/bookings/${bookingId}/checklist`);
    if (!res.ok) throw new Error("Checklist yüklenemedi");
    const json = await res.json();
    setItems(json.items ?? []);
    setComments(json.comments ?? []);
    setToken(json.checklistToken ?? null);
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
  }, [bookingId]);

  const handleSeedTemplate = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedTemplate: true }),
      });
      if (!res.ok) throw new Error("Şablon oluşturulamadı");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    setItems((prev) => prev?.map((it) => (it.id === item.id ? { ...it, is_done: !it.is_done } : it)) ?? null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checklist`, {
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

  const handleDelete = async (itemId: string) => {
    setItems((prev) => prev?.filter((it) => it.id !== itemId) ?? null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checklist?itemId=${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      reload();
    }
  };

  const handleAddItem = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory, title: newTitle.trim() }),
      });
      if (!res.ok) throw new Error("Eklenemedi");
      setNewTitle("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    }
  };

  const handleAddComment = async (itemId: string) => {
    if (!commentDraft.trim()) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checklist/comments`, {
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

  const handleCopyLink = () => {
    if (!token) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.noqt.events";
    navigator.clipboard.writeText(`${origin}/planlama/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setPdfGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/project-file`, { method: "POST" });
      if (!res.ok) throw new Error("PDF oluşturulamadı");
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setPdfGenerating(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.noqt.events";
  const doneCount = items?.filter((i) => i.is_done).length ?? 0;
  const totalCount = items?.length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Planlama & Checklist</p>
          {totalCount > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{doneCount} / {totalCount} tamamlandı</p>
          )}
        </div>
        <button onClick={handleDownloadPdf} disabled={pdfGenerating}
          className="text-xs px-3 py-1.5 border border-border rounded-full text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
          {pdfGenerating ? "Oluşturuluyor…" : "📄 Proje Dosyası (PDF)"}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      {token && (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/10 text-xs font-mono text-muted-foreground truncate">
            {origin}/planlama/{token}
          </div>
          <button onClick={handleCopyLink}
            className="text-xs px-3 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors flex-shrink-0">
            {copied ? "✓ Kopyalandı" : "Kopyala"}
          </button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Bu link ile {clientName} kendi checklist&apos;ini görüntüleyip maddeleri işaretleyebilir ve yorum ekleyebilir.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : totalCount === 0 ? (
        <button onClick={handleSeedTemplate}
          className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
          Şablondan Checklist Oluştur
        </button>
      ) : (
        <div className="space-y-4">
          {CATEGORY_ORDER.filter((cat) => items?.some((i) => i.category === cat)).map((cat) => (
            <div key={cat} className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">{CATEGORY_LABELS[cat]}</p>
              {items?.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className="border border-border rounded-xl">
                  <div className="flex items-start gap-2 px-3 py-2">
                    <input type="checkbox" checked={item.is_done} onChange={() => handleToggle(item)}
                      className="mt-0.5 w-4 h-4 rounded border-border flex-shrink-0" />
                    <button onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
                      className={`flex-1 text-left text-sm ${item.is_done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.title}
                    </button>
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

      {totalCount > 0 && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as ChecklistCategory)}
            className={`${inputCls} flex-shrink-0 w-40`}>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Yeni madde…"
            className={inputCls} />
          <button onClick={handleAddItem} disabled={!newTitle.trim()}
            className="text-xs px-3 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-50 flex-shrink-0">
            Ekle
          </button>
        </div>
      )}
    </div>
  );
}
