"use client";

import { useState } from "react";

export default function RsvpForm({
  invitationId,
  deadline,
  invitationUrl,
  dark = false,
}: {
  invitationId: string;
  deadline?: string | null;
  invitationUrl: string;
  dark?: boolean;
}) {
  const [attending, setAttending] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [count, setCount] = useState(1);
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  function handleCountChange(n: number) {
    setCount(n);
    // (n - 1) refakatçi ismi alanı — girilenleri korur, fazlasını kırpar
    setCompanionNames((prev) => {
      const needed = Math.max(0, n - 1);
      const next = prev.slice(0, needed);
      while (next.length < needed) next.push("");
      return next;
    });
  }

  function updateCompanionName(i: number, value: string) {
    setCompanionNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }

  const t = dark
    ? {
        label: "text-white/60",
        input: "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50",
        btnPrimary: "bg-white text-black hover:opacity-90",
        btnOutline: "border border-white/30 text-white hover:border-white/60",
        active: "bg-white text-black border-white",
        inactive: "border-white/20 text-white/70 hover:border-white/40",
        muted: "text-white/40",
      }
    : {
        label: "text-muted-foreground",
        input: "bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/40",
        btnPrimary: "bg-foreground text-background hover:opacity-90",
        btnOutline: "border border-border text-foreground hover:border-foreground/40",
        active: "bg-foreground text-background border-foreground",
        inactive: "border-border text-muted-foreground hover:border-foreground/40",
        muted: "text-muted-foreground",
      };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || attending === null) return;
    setState("loading");
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invitation_id: invitationId,
        guest_name: name,
        guest_email: email || null,
        guest_count: count,
        companion_names: companionNames.map((n) => n.trim()).filter(Boolean),
        attending,
        message,
      }),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className="space-y-4">
        <div className={`rounded-2xl p-6 ${dark ? "bg-white/10" : "bg-secondary"}`}>
          <p className={`text-lg font-light ${dark ? "text-white" : "text-foreground"}`}>
            {attending ? "Görüşürüz! 🎉" : "Anlıyoruz, iyi günler dileriz."}
          </p>
          <p className={`text-sm mt-1 ${t.muted}`}>
            Yanıtınız alındı.{email ? " Onay e-postası gönderildi." : ""}
          </p>
        </div>
        <a
          href={`${invitationUrl}?print=1`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 text-sm px-5 py-3 rounded-full transition-colors ${t.btnOutline}`}
          onClick={(e) => {
            e.preventDefault();
            window.open(invitationUrl + "?print=1", "_blank");
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Daveti PDF olarak kaydet
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {deadline && (
        <p className={`text-xs ${t.muted}`}>
          Son yanıt tarihi: {new Date(deadline).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}

      <div>
        <label className={`block text-xs uppercase tracking-widest mb-2 ${t.label}`}>Adınız</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ad Soyad"
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${t.input}`}
        />
      </div>

      <div>
        <label className={`block text-xs uppercase tracking-widest mb-2 ${t.label}`}>
          E-posta <span className={t.muted}>(isteğe bağlı)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@mail.com"
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${t.input}`}
        />
        <p className={`text-xs mt-1 ${t.muted}`}>Girerseniz davetiye linki e-postanıza gönderilecek.</p>
      </div>

      <div>
        <label className={`block text-xs uppercase tracking-widest mb-3 ${t.label}`}>Katılacak mısınız?</label>
        <div className="flex gap-3">
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setAttending(val)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                attending === val ? t.active : t.inactive
              }`}
            >
              {val ? "Evet, geleceğim ✓" : "Katılamayacağım"}
            </button>
          ))}
        </div>
      </div>

      {attending && (
        <div>
          <label className={`block text-xs uppercase tracking-widest mb-2 ${t.label}`}>Kaç kişi?</label>
          <select
            value={count}
            onChange={(e) => handleCountChange(Number(e.target.value))}
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none ${t.input}`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} kişi</option>
            ))}
          </select>
        </div>
      )}

      {attending && count > 1 && (
        <div>
          <label className={`block text-xs uppercase tracking-widest mb-2 ${t.label}`}>
            Sizinle Gelecekler <span className={t.muted}>(isteğe bağlı)</span>
          </label>
          <div className="space-y-2">
            {companionNames.map((cn, i) => (
              <input
                key={i}
                value={cn}
                onChange={(e) => updateCompanionName(i, e.target.value)}
                placeholder={`${i + 2}. kişi — Ad Soyad`}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${t.input}`}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <label className={`block text-xs uppercase tracking-widest mb-2 ${t.label}`}>Mesaj <span className={t.muted}>(isteğe bağlı)</span></label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Tebrik mesajınız…"
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none resize-none transition-colors ${t.input}`}
        />
      </div>

      <button
        type="submit"
        disabled={state === "loading" || attending === null || !name.trim()}
        className={`w-full py-4 rounded-full text-sm font-medium transition-opacity disabled:opacity-40 ${t.btnPrimary}`}
      >
        {state === "loading" ? "Gönderiliyor…" : "Yanıtı Gönder"}
      </button>

      {state === "error" && (
        <p className="text-red-500 text-xs text-center">Bir hata oluştu, tekrar deneyin.</p>
      )}
    </form>
  );
}
