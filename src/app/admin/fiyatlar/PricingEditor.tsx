"use client";

import { useState, useTransition } from "react";
import {
  upsertTier, deleteTier,
  upsertFactor, deleteFactor,
  upsertFaqItem, deleteFaqItem,
  type PricingTier, type PricingFactor, type PricingFaqItem,
} from "./actions";

// ── Shared helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-muted-foreground mb-1">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full border border-border rounded-lg px-3 py-2 text-sm ${props.className ?? ""}`} />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full border border-border rounded-lg px-3 py-2 text-sm font-mono resize-none ${props.className ?? ""}`} />;
}

function SaveBtn({ pending, label = "Kaydet" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-foreground text-background px-5 py-2 rounded-full text-sm font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
    >
      {pending ? "Kaydediliyor…" : label}
    </button>
  );
}

function DeleteBtn({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={pending} className="text-sm text-red-600 hover:underline disabled:opacity-50">
      Sil
    </button>
  );
}

// ── Tier form ─────────────────────────────────────────────────────────────────

function TierForm({ tier, onDone }: { tier?: PricingTier; onDone?: () => void }) {
  const [p, startT] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const isNew = !tier?.id;

  const [label, setLabel] = useState(tier?.label ?? "");
  const [emoji, setEmoji] = useState(tier?.emoji ?? "🎵");
  const [range, setRange] = useState(tier?.range_text ?? "");
  const [desc, setDesc] = useState(tier?.description ?? "");
  const [includes, setIncludes] = useState((tier?.includes ?? []).join("\n"));
  const [suitable, setSuitable] = useState((tier?.suitable ?? []).join("\n"));
  const [featured, setFeatured] = useState(tier?.is_featured ?? false);
  const [dark, setDark] = useState(tier?.is_dark ?? false);
  const [color, setColor] = useState(tier?.color ?? "bg-[oklch(0.975_0.006_80)]");
  const [active, setActive] = useState(tier?.is_active ?? true);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    startT(async () => {
      try {
        await upsertTier({
          ...(tier?.id ? { id: tier.id } : {}),
          label, emoji, range_text: range,
          description: desc || null,
          includes: includes.split("\n").filter(Boolean),
          suitable: suitable.split("\n").filter(Boolean),
          is_featured: featured, is_dark: dark, color,
          is_active: active,
          sort_order: tier?.sort_order ?? 99,
        });
        if (isNew) {
          setLabel(""); setEmoji("🎵"); setRange(""); setDesc("");
          setIncludes(""); setSuitable(""); setFeatured(false); setDark(false);
        }
        onDone?.();
      } catch (e) { setErr(e instanceof Error ? e.message : "Hata"); }
    });
  };

  const remove = () => {
    if (!tier?.id || !confirm("Bu bütçe seviyesini silmek istediğinize emin misiniz?")) return;
    startT(async () => { try { await deleteTier(tier.id); onDone?.(); } catch (e) { setErr(e instanceof Error ? e.message : "Hata"); } });
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div><Label>Emoji</Label><Input value={emoji} onChange={e => setEmoji(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Seviye Adı</Label><Input value={label} onChange={e => setLabel(e.target.value)} required /></div>
      </div>
      <div><Label>Fiyat Aralığı (görünen metin)</Label><Input value={range} onChange={e => setRange(e.target.value)} placeholder="₺8.000 – ₺18.000" required /></div>
      <div><Label>Açıklama</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></div>
      <div>
        <Label>Dahil olanlar (her satıra bir madde)</Label>
        <Textarea value={includes} onChange={e => setIncludes(e.target.value)} rows={4} />
      </div>
      <div>
        <Label>Uygun etkinlikler (her satıra bir tane)</Label>
        <Textarea value={suitable} onChange={e => setSuitable(e.target.value)} rows={3} />
      </div>
      <div>
        <Label>Arka plan rengi (Tailwind class)</Label>
        <Input value={color} onChange={e => setColor(e.target.value)} placeholder="bg-[oklch(0.975_0.006_80)]" />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} /> Öne çıkan
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} /> Koyu arka plan
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Aktif
        </label>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex items-center gap-3 pt-1">
        <SaveBtn pending={p} label={isNew ? "Ekle" : "Kaydet"} />
        {!isNew && <DeleteBtn onClick={remove} pending={p} />}
      </div>
    </form>
  );
}

// ── Factor form ───────────────────────────────────────────────────────────────

function FactorRow({ f, onDone }: { f: PricingFactor; onDone?: () => void }) {
  const [p, startT] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [factor, setFactor] = useState(f.factor);
  const [impact, setImpact] = useState(f.impact);
  const [active, setActive] = useState(f.is_active);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startT(async () => {
      try { await upsertFactor({ id: f.id, factor, impact, is_active: active, sort_order: f.sort_order }); onDone?.(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Hata"); }
    });
  };

  const remove = () => {
    if (!confirm("Bu faktörü silmek istediğinize emin misiniz?")) return;
    startT(async () => { try { await deleteFactor(f.id); onDone?.(); } catch (e) { setErr(e instanceof Error ? e.message : "Hata"); } });
  };

  return (
    <form onSubmit={save} className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end border border-border rounded-xl p-4">
      <div><Label>Faktör</Label><Input value={factor} onChange={e => setFactor(e.target.value)} required /></div>
      <div><Label>Açıklama / Etki</Label><Input value={impact} onChange={e => setImpact(e.target.value)} required /></div>
      <div className="flex items-center gap-2 pb-0.5">
        <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Aktif
        </label>
        <SaveBtn pending={p} />
        <DeleteBtn onClick={remove} pending={p} />
      </div>
      {err && <p className="text-sm text-red-600 sm:col-span-3">{err}</p>}
    </form>
  );
}

function NewFactorForm({ onDone }: { onDone?: () => void }) {
  const [p, startT] = useTransition();
  const [factor, setFactor] = useState("");
  const [impact, setImpact] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startT(async () => {
      try { await upsertFactor({ factor, impact, is_active: true, sort_order: 99 }); setFactor(""); setImpact(""); onDone?.(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Hata"); }
    });
  };

  return (
    <form onSubmit={save} className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end border border-dashed border-border rounded-xl p-4 bg-secondary/30">
      <div><Label>Yeni Faktör</Label><Input value={factor} onChange={e => setFactor(e.target.value)} placeholder="Mekan büyüklüğü" required /></div>
      <div><Label>Etki</Label><Input value={impact} onChange={e => setImpact(e.target.value)} placeholder="Büyük salon → güçlü ses sistemi" required /></div>
      <div className="pb-0.5"><SaveBtn pending={p} label="Ekle" /></div>
      {err && <p className="text-sm text-red-600 sm:col-span-3">{err}</p>}
    </form>
  );
}

// ── FAQ form ──────────────────────────────────────────────────────────────────

function FaqRow({ item, onDone }: { item: PricingFaqItem; onDone?: () => void }) {
  const [p, startT] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState(item.question);
  const [a, setA] = useState(item.answer);
  const [active, setActive] = useState(item.is_active);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startT(async () => {
      try { await upsertFaqItem({ id: item.id, question: q, answer: a, is_active: active, sort_order: item.sort_order }); onDone?.(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Hata"); }
    });
  };

  const remove = () => {
    if (!confirm("Bu SSS maddesini silmek istediğinize emin misiniz?")) return;
    startT(async () => { try { await deleteFaqItem(item.id); onDone?.(); } catch (e) { setErr(e instanceof Error ? e.message : "Hata"); } });
  };

  return (
    <form onSubmit={save} className="border border-border rounded-xl p-5 space-y-3">
      <div><Label>Soru</Label><Input value={q} onChange={e => setQ(e.target.value)} required /></div>
      <div><Label>Cevap</Label><Textarea value={a} onChange={e => setA(e.target.value)} rows={3} /></div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Aktif
        </label>
        <SaveBtn pending={p} />
        <DeleteBtn onClick={remove} pending={p} />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}

function NewFaqForm({ onDone }: { onDone?: () => void }) {
  const [p, startT] = useTransition();
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startT(async () => {
      try { await upsertFaqItem({ question: q, answer: a, is_active: true, sort_order: 99 }); setQ(""); setA(""); onDone?.(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Hata"); }
    });
  };

  return (
    <form onSubmit={save} className="border border-dashed border-border rounded-xl p-5 space-y-3 bg-secondary/30">
      <p className="text-xs font-medium text-muted-foreground">Yeni SSS maddesi</p>
      <div><Label>Soru</Label><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Depozito alıyor musunuz?" required /></div>
      <div><Label>Cevap</Label><Textarea value={a} onChange={e => setA(e.target.value)} rows={3} /></div>
      <SaveBtn pending={p} label="Ekle" />
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

export default function PricingEditor({
  tiers,
  factors,
  faq,
}: {
  tiers: PricingTier[];
  factors: PricingFactor[];
  faq: PricingFaqItem[];
}) {
  const [tab, setTab] = useState<"tiers" | "factors" | "faq">("tiers");

  const tabs = [
    { id: "tiers" as const, label: "Bütçe Seviyeleri" },
    { id: "factors" as const, label: "Fiyatı Etkileyen Faktörler" },
    { id: "faq" as const, label: "SSS" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Bütçe seviyeleri */}
      {tab === "tiers" && (
        <div className="space-y-6">
          {tiers.map((tier) => (
            <div key={tier.id} className="border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{tier.emoji}</span>
                <div>
                  <h3 className="font-medium">{tier.label}</h3>
                  <p className="text-xs text-muted-foreground">{tier.range_text}</p>
                </div>
                {!tier.is_active && (
                  <span className="ml-auto text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">Pasif</span>
                )}
              </div>
              <TierForm tier={tier} />
            </div>
          ))}
          <div className="border border-dashed border-border rounded-xl p-6">
            <p className="text-sm font-medium text-muted-foreground mb-5">Yeni bütçe seviyesi ekle</p>
            <TierForm />
          </div>
        </div>
      )}

      {/* Faktörler */}
      {tab === "factors" && (
        <div className="space-y-3">
          {factors.map((f) => <FactorRow key={f.id} f={f} />)}
          <NewFactorForm />
        </div>
      )}

      {/* SSS */}
      {tab === "faq" && (
        <div className="space-y-4">
          {faq.map((item) => <FaqRow key={item.id} item={item} />)}
          <NewFaqForm />
        </div>
      )}
    </div>
  );
}
