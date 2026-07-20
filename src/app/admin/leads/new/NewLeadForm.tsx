"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_SOURCES } from "@/lib/leads";
import { EVENT_TYPES } from "@/components/planner/PlannerStore";
import { createLead } from "../actions";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors";

export default function NewLeadForm() {
  const router = useRouter();
  const [source, setSource] = useState("armut");
  const [fields, setFields] = useState({
    source_ref: "", customer_name: "", event_type: "", event_date: "",
    location: "", budget_text: "", description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (fields.description.trim().length < 5) { setError("Talep metni zorunludur."); return; }
    setLoading(true);
    setError(null);
    try {
      const { id } = await createLead({ source, ...fields });
      router.push(`/admin/leads/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground tracking-wide font-medium">KAYNAK</label>
        <div className="flex flex-wrap gap-2">
          {LEAD_SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s.id)}
              className={`px-4 py-2 rounded-full text-xs border transition-colors ${
                source === s.id
                  ? "bg-foreground text-background border-foreground font-medium"
                  : "bg-white text-muted-foreground border-border hover:border-foreground/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground tracking-wide">Müşteri adı</label>
          <input type="text" value={fields.customer_name} onChange={set("customer_name")} placeholder="Ayşe K." className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground tracking-wide">Kaynak referansı (talep no)</label>
          <input type="text" value={fields.source_ref} onChange={set("source_ref")} placeholder="armut-123456 (varsa)" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground tracking-wide">Etkinlik türü</label>
          <select value={fields.event_type} onChange={set("event_type")} className={inputCls}>
            <option value="">Bilinmiyor — AI tahmin etsin</option>
            {EVENT_TYPES.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground tracking-wide">Etkinlik tarihi</label>
          <input type="date" value={fields.event_date} onChange={set("event_date")} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground tracking-wide">Konum</label>
          <input type="text" value={fields.location} onChange={set("location")} placeholder="Kayseri" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground tracking-wide">Bütçe (ham ifade)</label>
          <input type="text" value={fields.budget_text} onChange={set("budget_text")} placeholder='"5-10 bin arası" / boş' className={inputCls} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground tracking-wide">
          Talep metni <span className="text-red-500">*</span> — müşterinin mesajını olduğu gibi yapıştır
        </label>
        <textarea
          value={fields.description}
          onChange={set("description")}
          rows={7}
          placeholder={"Merhaba, 12 Eylül'de düğünümüz var. DJ ve ses sistemi arıyoruz..."}
          className={`${inputCls} resize-y leading-relaxed`}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={loading || fields.description.trim().length < 5}
        className={`w-full py-3.5 rounded-full text-sm font-medium tracking-wide transition-all ${
          !loading && fields.description.trim().length >= 5
            ? "bg-foreground text-background hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {loading ? "Kaydediliyor ve analiz ediliyor…" : "Kaydet ve Analiz Et →"}
      </button>
    </div>
  );
}
