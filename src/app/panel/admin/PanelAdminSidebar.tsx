"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// noqt.events admin'deki src/app/admin/AdminSidebar.tsx deseninden uyarlandı:
// aynı gruplu menü + aktif vurgu + mobil açılır menü mantığı. İKİ bilinçli
// fark var:
// 1) /panel altında zaten sabit bir üst çubuk var (PanelNav, bkz.
//    ../PanelNav.tsx — DOKUNULMADI, görev kapsamı yalnız /panel/admin). Bu
//    yüzden AdminSidebar'daki "fixed top mobile bar" burada TEKRARLANMIYOR
//    (iki sabit çubuk üst üste binerdi); onun yerine akışın başında normal
//    (fixed olmayan) bir "Admin menüsü" tetikleyicisi var — açıldığında
//    AdminSidebar ile birebir aynı tam ekran overlay çekmecesi geliyor.
// 2) AdminSidebar.tsx `NavLinks`'i bileşen gövdesi İÇİNDE tanımlıyor ve rota
//    değişiminde `useEffect(() => setOpen(false), [pathname])` kullanıyor —
//    ikisi de bu repodaki react-hooks/static-components ve
//    react-hooks/set-state-in-effect kurallarına takılıyor (AdminSidebar.tsx
//    üstünde de aynı hata var, ama o dosyaya dokunmuyoruz). Burada NavLinks
//    modül seviyesine taşındı, kapanma da "prop değişince state'i render
//    sırasında ayarla" deseniyle yapıldı — davranış birebir aynı, yalnız
//    lint-temiz.

const NAV_GROUPS: { title: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    title: "Arz",
    items: [
      { href: "/panel/admin", label: "Genel Bakış", icon: "▦" },
      { href: "/panel/admin/mekanlar", label: "Mekanlar", icon: "📍" },
      { href: "/panel/admin/sanatcilar", label: "Sanatçılar", icon: "🎧" },
      { href: "/panel/admin/etkinlikler", label: "Etkinlikler", icon: "🗂" },
      { href: "/panel/admin/claims", label: "Sahiplenmeler", icon: "🤝" },
      { href: "/panel/admin/davetler", label: "Davetler", icon: "💌" },
    ],
  },
  {
    title: "Uygulama",
    items: [
      { href: "/panel/admin/uygulama/kullanicilar", label: "Kullanıcılar", icon: "👤" },
      { href: "/panel/admin/uygulama/geribildirim", label: "Geri Bildirim", icon: "💬" },
      { href: "/panel/admin/uygulama/istatistikler", label: "İstatistikler", icon: "📊" },
    ],
  },
];

// Genel Bakış ("/panel/admin") yalnız TAM eşleşmede aktif — aksi halde her
// alt sayfada da yanardı. Diğer öğeler kendi alt yollarında da aktif kalır
// (ör. /panel/admin/mekanlar/[id] üstünde "Mekanlar" vurgulu kalsın).
function isActive(pathname: string, href: string): boolean {
  if (href === "/panel/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">{group.title}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center text-base leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function PanelAdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Rota değişince açık çekmeceyi kapat — useEffect yerine "prop değişince
  // state'i render sırasında ayarla" deseni (React docs: "You Might Not Need
  // an Effect"), AdminSidebar.tsx'teki useEffect ile aynı sonucu verir.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Masaüstü kenar çubuğu — AdminSidebar ile birebir aynı zemin/vurgu */}
      <aside className="hidden w-56 flex-shrink-0 flex-col bg-foreground text-background lg:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] opacity-50">Admin</p>
          <p className="text-sm font-semibold">NOQT Panel</p>
        </div>
        <NavLinks pathname={pathname} />
        <div className="border-t border-white/10 px-5 py-4">
          <Link href="/panel" className="text-xs text-white/50 transition-colors hover:text-white">
            ← Panele dön
          </Link>
        </div>
      </aside>

      {/* Mobil tetikleyici — sabit değil (PanelNav zaten sabit üst çubuğu sağlıyor) */}
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5 lg:hidden">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
        <button
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 flex-col items-center justify-center gap-1"
          aria-label="Admin menüsü"
        >
          <span className="block h-0.5 w-4 bg-foreground" />
          <span className="block h-0.5 w-4 bg-foreground" />
          <span className="block h-0.5 w-4 bg-foreground" />
        </button>
      </div>

      {/* Mobil çekmece overlay — AdminSidebar ile birebir */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-foreground text-background">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <div>
                <p className="mb-0.5 text-xs uppercase tracking-[0.25em] opacity-50">Admin</p>
                <p className="text-sm font-semibold">NOQT Panel</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center text-white/60 hover:text-white"
                aria-label="Kapat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="border-t border-white/10 px-5 py-4">
              <Link href="/panel" onClick={() => setOpen(false)} className="text-xs text-white/50 hover:text-white">
                ← Panele dön
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
