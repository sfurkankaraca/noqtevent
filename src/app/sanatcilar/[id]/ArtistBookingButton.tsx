"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import ArtistBookingWizard from "@/components/artist-booking/ArtistBookingWizard";
import type { FeeRange } from "@/lib/artistPricing";

export default function ArtistBookingButton({
  artistId,
  artistName,
  baseFeeMin = null,
  baseFeeMax = null,
  eventTypeFees = null,
}: {
  artistId: string;
  artistName: string;
  baseFeeMin?: number | null;
  baseFeeMax?: number | null;
  eventTypeFees?: Record<string, FeeRange> | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Bu Sanatçıyla Planla
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <ArtistBookingWizard
            artistId={artistId}
            artistName={artistName}
            baseFeeMin={baseFeeMin}
            baseFeeMax={baseFeeMax}
            eventTypeFees={eventTypeFees}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
