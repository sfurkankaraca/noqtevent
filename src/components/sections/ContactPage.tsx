"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  eventType: string;
  message: string;
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    eventType: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Left */}
        <div>
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
            İletişim
          </span>
          <h1
            className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Konuşalım.
          </h1>
          <p className="text-muted-foreground mt-6 leading-relaxed max-w-md">
            Etkinliğini planlamak için yardıma mı ihtiyacın var? Ekibimizden
            biri 24 saat içinde geri döner.
          </p>

          <div className="mt-12 space-y-5">
            <a
              href="mailto:merhaba@noqt.co"
              className="flex items-center gap-4 group"
            >
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center group-hover:bg-foreground transition-colors">
                <Mail size={16} className="text-muted-foreground group-hover:text-background transition-colors" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-posta</p>
                <p className="text-sm font-medium text-foreground">merhaba@noqt.co</p>
              </div>
            </a>

            <a
              href="https://instagram.com/noqt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 group"
            >
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center group-hover:bg-foreground transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-background transition-colors">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Instagram</p>
                <p className="text-sm font-medium text-foreground">@noqt</p>
              </div>
            </a>
          </div>

          <div className="mt-12 p-6 bg-[oklch(0.975_0.006_80)] rounded-2xl">
            <p className="text-sm font-medium text-foreground mb-2">
              Hızlı başlamak ister misin?
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Deneyim planlayıcısını kullan. 10 soruda etkinliğini tasarla,
              kişiselleştirilmiş teklif al.
            </p>
            <a
              href="/planla"
              className="text-xs font-medium text-foreground border-b border-foreground/30 hover:border-foreground/60 transition-colors pb-0.5"
            >
              Planlayıcıyı Başlat →
            </a>
          </div>
        </div>

        {/* Right — form */}
        <div>
          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-16"
            >
              <div className="text-4xl mb-4">✉️</div>
              <h2
                className="text-2xl text-foreground"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
              >
                Mesajın alındı!
              </h2>
              <p className="text-muted-foreground mt-3">
                En kısa sürede, genellikle 24 saat içinde geri dönüyoruz.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground tracking-wide">
                  Adın Soyadın
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Ayşe Yılmaz"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground tracking-wide">
                  E-posta
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="ayse@example.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground tracking-wide">
                  Etkinlik Türü
                </label>
                <select
                  value={form.eventType}
                  onChange={(e) => update("eventType", e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors appearance-none"
                >
                  <option value="">Seçiniz</option>
                  <option value="wedding">Düğün</option>
                  <option value="corporate">Kurumsal Etkinlik</option>
                  <option value="opening">Açılış</option>
                  <option value="brand-launch">Marka Lansmanı</option>
                  <option value="private">Özel Parti</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground tracking-wide">
                  Mesajın
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Etkinliğin hakkında birkaç cümle yaz..."
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-foreground text-background rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? "Gönderiliyor..." : "Gönder"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
