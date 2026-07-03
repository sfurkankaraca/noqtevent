"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/songs", label: "Şarkılar", icon: "♪" },
  { href: "/admin/gorseller", label: "Görseller", icon: "🖼" },
  { href: "/admin/djler", label: "Sanatçılar", icon: "🎧" },
  { href: "/admin/partnerler", label: "Partnerler", icon: "🤝" },
  { href: "/admin/konseptler", label: "Konseptler", icon: "✦" },
  { href: "/admin/journal", label: "Journal", icon: "✍" },
  { href: "/admin/testimonials", label: "Yorumlar", icon: "💬" },
  { href: "/admin/inquiries", label: "Talepler", icon: "📋" },
  { href: "/admin/bookings", label: "Bookings", icon: "🎤" },
  { href: "/admin/finans", label: "Finans", icon: "₺" },
  { href: "/admin/mesajlar", label: "Mesajlar", icon: "💬" },
  { href: "/admin/davetiyeler", label: "Davetiyeler", icon: "💌" },
  { href: "/admin/memory", label: "Memory Drive", icon: "📸" },
  { href: "/admin/users", label: "Kullanıcılar", icon: "👤" },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="text-base leading-none w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 bg-foreground text-background flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-xs tracking-[0.25em] uppercase opacity-50 mb-1">Admin</p>
          <p className="font-semibold text-sm">NOQT Studio</p>
        </div>
        <NavLinks />
        <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          <p className="text-xs text-white/50">Hesabım</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-foreground text-background flex items-center justify-between px-4 h-14">
        <p className="font-semibold text-sm">NOQT Studio</p>
        <div className="flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          <button
            onClick={() => setOpen(true)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            aria-label="Menü"
          >
            <span className="w-5 h-0.5 bg-white block" />
            <span className="w-5 h-0.5 bg-white block" />
            <span className="w-5 h-0.5 bg-white block" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-foreground text-background flex flex-col h-full">
            <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs tracking-[0.25em] uppercase opacity-50 mb-0.5">Admin</p>
                <p className="font-semibold text-sm">NOQT Studio</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <NavLinks onClick={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
