import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  "Hizmetler": [
    { label: "Deneyim Planlayıcı", href: "/planla" },
    { label: "Düğün", href: "/deneyimler/dugun" },
    { label: "Kurumsal Etkinlik", href: "/deneyimler/kurumsal" },
    { label: "Açılış & Lansman", href: "/deneyimler/acilis" },
    { label: "Özel Parti", href: "/deneyimler/ozel-parti" },
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
                href="https://instagram.com/noqt"
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
                href="https://youtube.com/noqt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/60 hover:text-background transition-colors"
                aria-label="YouTube"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96C1 8.12 1 12 1 12s0 3.88.46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.88 23 12 23 12s0-3.88-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
                </svg>
              </a>
              {/* SoundCloud icon (custom SVG) */}
              <a
                href="https://soundcloud.com/noqt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/60 hover:text-background transition-colors"
                aria-label="SoundCloud"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.175 12.225c-.015.132-.023.265-.023.4 0 .135.008.268.023.4.015.132.038.262.067.39l-.067-.39V12.225zm.85.95c-.008-.052-.012-.104-.012-.175 0-.068.004-.12.012-.175-.008.055-.012.107-.012.175 0 .07.004.123.012.175zm12.775-8.35c-2.025 0-3.75 1.45-4.15 3.375-.35-.175-.75-.275-1.15-.275-1.475 0-2.675 1.2-2.675 2.675 0 .1.006.198.018.295C4.44 11.28 3.1 12.83 3.1 14.7c0 2.075 1.675 3.75 3.75 3.75h7.95c2.075 0 3.75-1.675 3.75-3.75 0-1.638-1.05-3.035-2.525-3.538.025-.162.038-.33.038-.5 0-2.487-2.013-4.5-4.5-4.5z"/>
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
