"use client";

import { useState } from "react";
import { type PlannerData } from "../PlannerStore";

type Props = {
  data: PlannerData;
  update: (p: Partial<PlannerData>) => void;
  onSubmit: () => void;
};

export default function Step10Contact({ data, update, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);

  const valid =
    data.name && data.surname && data.email && data.phone;

  const submit = async () => {
    if (!valid) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    onSubmit();
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-[oklch(0.94_0.008_60)] rounded-2xl p-5 text-sm text-muted-foreground leading-relaxed">
        Deneyim taslağın hazır. İletişim bilgilerini girerek bize ilet,
        en kısa sürede ulaşalım.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground tracking-wide">İsim</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Ayşe"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground tracking-wide">Soyisim</label>
          <input
            type="text"
            value={data.surname}
            onChange={(e) => update({ surname: e.target.value })}
            placeholder="Yılmaz"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground tracking-wide">E-posta</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="ayse@example.com"
          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground tracking-wide">Telefon</label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => update({ phone: e.target.value })}
          placeholder="+90 5xx xxx xx xx"
          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground tracking-wide">
          Etkinlik Tarihi{" "}
          <span className="opacity-60">(yaklaşık)</span>
        </label>
        <input
          type="date"
          value={data.eventDate}
          onChange={(e) => update({ eventDate: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
        />
      </div>

      <button
        onClick={submit}
        disabled={!valid || loading}
        className={`w-full py-4 rounded-full text-sm font-medium tracking-wide transition-all ${
          valid && !loading
            ? "bg-foreground text-background hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {loading ? "Gönderiliyor..." : "Deneyim Taslağımı Gönder"}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Bilgilerin yalnızca seninle iletişim kurmak için kullanılır.
        Asla üçüncü şahıslarla paylaşılmaz.
      </p>
    </div>
  );
}
