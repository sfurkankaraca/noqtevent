"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/panel/actions/auth";

const NAV = [
  { href: "/panel", label: "Panelim" },
  { href: "/panel/takvim", label: "Takvim" },
  { href: "/panel/etkinlik/yeni", label: "Etkinlik Oluştur" },
  { href: "/panel/onaylar", label: "Onaylar" },
  { href: "/panel/sahiplen", label: "Profil Sahiplen" },
];

export default function PanelNav({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const items = isAdmin ? [...NAV, { href: "/panel/admin", label: "Admin" }] : NAV;

  const Links = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-foreground px-4 text-background">
        <Link href="/panel" className="text-sm font-semibold">
          NOQT Panel
        </Link>
        <div className="flex items-center gap-2">
          {signedIn && (
            <form action={signOutAction}>
              <button type="submit" className="hidden text-xs text-white/60 hover:text-white sm:inline">
                Çıkış yap
              </button>
            </form>
          )}
          <button
            onClick={() => setOpen(true)}
            aria-label="Menü"
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
          >
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-foreground p-4 text-background">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">NOQT Panel</span>
              <button onClick={() => setOpen(false)} aria-label="Kapat" className="h-8 w-8 text-white/60 hover:text-white">
                ✕
              </button>
            </div>
            <Links onClick={() => setOpen(false)} />
            {signedIn && (
              <form action={signOutAction} className="mt-auto pt-4">
                <button type="submit" className="text-sm text-white/60 hover:text-white">
                  Çıkış yap
                </button>
              </form>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
