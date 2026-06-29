"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { submitContactMessage } from "@/app/iletisim/actions";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await submitContactMessage(fd);
      setSent(true);
    });
  }

  const inputCls =
    "w-full px-4 py-3.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors";

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
            <a href="mailto:booking@noqt.events" className="flex items-center gap-4 group">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center group-hover:bg-foreground transition-colors">
                <Mail size={16} className="text-muted-foreground group-hover:text-background transition-colors" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-posta</p>
                <p className="text-sm font-medium text-foreground">booking@noqt.events</p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/noqtevents"
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
                <p className="text-sm font-medium text-foreground">@noqtevents</p>
              </div>
            </a>

            <a href="tel:+905447335514" className="flex items-center gap-4 group">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center group-hover:bg-foreground transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-background transition-colors">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="text-sm font-medium text-foreground">0544 733 55 14</p>
              </div>
            </a>

            <a href="https://wa.me/905417997973" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center group-hover:bg-[#25D366] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground group-hover:text-white transition-colors">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="text-sm font-medium text-foreground">0541 799 79 73</p>
              </div>
            </a>
          </div>

          <div className="mt-12 p-6 bg-[oklch(0.975_0.006_80)] rounded-2xl">
            <p className="text-sm font-medium text-foreground mb-2">Hızlı başlamak ister misin?</p>
            <p className="text-xs text-muted-foreground mb-4">
              Deneyim planlayıcısını kullan. 10 soruda etkinliğini tasarla, kişiselleştirilmiş teklif al.
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground tracking-wide">Adın Soyadın</label>
                <input name="name" type="text" required placeholder="Ayşe Yılmaz" className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground tracking-wide">E-posta</label>
                <input name="email" type="email" required placeholder="ayse@example.com" className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground tracking-wide">Etkinlik Türü</label>
                <select name="eventType" className={inputCls + " appearance-none"}>
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
                <label className="text-xs text-muted-foreground tracking-wide">Mesajın</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Etkinliğin hakkında birkaç cümle yaz..."
                  className={inputCls + " resize-none"}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 bg-foreground text-background rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
              >
                {isPending ? "Gönderiliyor..." : "Gönder"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
