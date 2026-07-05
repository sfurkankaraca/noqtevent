import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  "Hizmetler": [
    { label: "Deneyim Planlayıcı", href: "/planla" },
    { label: "Düğün", href: "/etkinlikler/dugun-dj" },
    { label: "Kurumsal Etkinlik", href: "/etkinlikler/kurumsal-etkinlik" },
    { label: "Açılış & Lansman", href: "/etkinlikler/acilis-lansman" },
    { label: "Özel Parti", href: "/etkinlikler/ozel-parti" },
  ],
  "Keşfet": [
    { label: "Sanatçılar", href: "/sanatcilar" },
    { label: "Ortak Ekosistemi", href: "/ortaklar" },
    { label: "Memory Drive", href: "/memory-drive" },
    { label: "Dijital Davetiye", href: "/dijital-davetiye" },
    { label: "Journal", href: "/journal" },
  ],
  "Şirket": [
    { label: "Hakkımızda", href: "/hakkimizda" },
    { label: "İletişim", href: "/iletisim" },
    { label: "Gizlilik Politikası", href: "/gizlilik" },
    { label: "Kullanım Koşulları", href: "/kosullar" },
  ],
  "Topluluğa Katıl": [
    { label: "DJ Olmak İster Misin?", href: "https://www.noqta.club/academy" },
    { label: "Noqta Community", href: "https://www.noqta.club" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/">
              {/* Koyu footer zeminde logo doğal görünür */}
              <Image
                src="/noqt-logo.png"
                alt="NOQT"
                width={120}
                height={48}
                className="h-14 w-auto rounded-xl"
              />
            </Link>
            <p className="mt-6 text-background/60 text-sm leading-relaxed max-w-xs">
              İnsanları aynı anda, aynı hislerde buluşturan deneyimler.
              Müzik, atmosfer ve insan enerjisini bir araya getiriyoruz.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <a
                href="https://www.instagram.com/noqtevents"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/60 hover:text-background transition-colors"
                aria-label="Instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@noqtclubradio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/60 hover:text-background transition-colors"
                aria-label="YouTube"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96C1 8.12 1 12 1 12s0 3.88.46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.88 23 12 23 12s0-3.88-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs tracking-[0.2em] uppercase text-background/40 mb-5 font-medium">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-background/70 hover:text-background transition-colors"
                      {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40">
            © 2025 NOQT. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-background/40">
            İstanbul, Türkiye
          </p>
        </div>
      </div>
    </footer>
  );
}
