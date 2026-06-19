"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/konseptler", label: "Konseptler" },
  { href: "/sanatcilar", label: "Sanatçılar" },
  { href: "/ortaklar", label: "Partnerler" },
  { href: "/memory-drive", label: "Memory Drive" },
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
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[oklch(0.985_0.004_60/0.95)] backdrop-blur-md border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/noqt-logo-transparent.png"
                alt="NOQT"
                width={120}
                height={48}
                className="h-10 w-auto"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA + Mobile */}
            <div className="flex items-center gap-4">
              <Link
                href="/planla"
                className="hidden lg:inline-flex items-center gap-2 bg-foreground text-background text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity font-medium tracking-wide"
              >
                Deneyimini Tasarla
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

            <nav className="flex flex-col px-6 pt-12 gap-8 flex-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-3xl font-light text-foreground hover:text-muted-foreground transition-colors"
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
                Deneyimini Tasarla
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
