"use client";

import { useEffect } from "react";

export default function PrintTrigger() {
  useEffect(() => {
    // Sayfa yüklenince otomatik yazdırma dialogu aç
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
