"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/sanatcilar", label: "Sanatçılar" },
  { href: "/paketler", label: "Paketler" },
  { href: "/konseptler", label: "Konseptler" },
  { href: "/ortaklar", label: "Partnerler" },
  { href: "/journal", label: "Journal" },
  { href: "/hakkimizda", label: "Hakkımızda" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* Kaydırınca tam genişlik bardan yüzen cam "pill"e dönüşen menü */}
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "top-3 px-3 sm:px-5" : "top-0 px-0"
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 ${
            scrolled
              ? "max-w-5xl glass-panel border border-border rounded-full shadow-[0_12px_40px_-16px_rgba(0,0,0,0.18)]"
              : "max-w-7xl bg-transparent border border-transparent"
          }`}
        >
          <div className={`flex items-center justify-between px-5 lg:px-7 transition-all duration-500 ${scrolled ? "h-14" : "h-16 lg:h-20"}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/noqt-logo-transparent.png"
                alt="NOQT"
                width={120}
                height={48}
                className={`w-auto transition-all duration-500 ${scrolled ? "h-8" : "h-10"}`}
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA + Mobile */}
            <div className="flex items-center gap-4">
              <Link
                href="/planla"
                className="hidden lg:inline-flex items-center gap-2 bg-foreground text-background text-sm px-5 py-2.5 rounded-full font-medium tracking-wide transition-all duration-300 hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.4)] hover:-translate-y-0.5"
              >
                Etkinliğimi Planla
              </Link>
              <button
                onClick={() => setMenuOpen(true)}
                className="lg:hidden p-2 text-foreground"
                aria-label="Menüyü aç"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            <div className="flex items-center justify-between h-16 px-6">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <Image
                  src="/noqt-logo-transparent.png"
                  alt="NOQT"
                  width={120}
                  height={48}
                  className="h-10 w-auto"
                />
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2"
                aria-label="Menüyü kapat"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex flex-col px-6 pt-12 gap-7 flex-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-baseline gap-4"
                >
                  <span className="text-xs text-muted-foreground/50 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-4xl text-foreground hover:text-muted-foreground transition-colors"
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="px-6 pb-12">
              <Link
                href="/planla"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center bg-foreground text-background text-sm px-6 py-4 rounded-full font-medium tracking-wide w-full"
              >
                Etkinliğimi Planla
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
