"use server";

import { createServiceClient } from "@/lib/supabase";
import { sendArtistBookingNotification, sendArtistBookingConfirmation } from "@/lib/email";
import type { ArtistBookingData } from "@/components/artist-booking/ArtistBookingWizard";

// Human-readable labels for booking event types
const BOOKING_EVENT_LABELS: Record<string, string> = {
  festival: "Festival",
  "club-night": "Kulüp / Bar Gecesi",
  "after-party": "After Party",
  "morning-party": "Morning Party",
  "private-party": "Özel Parti",
  birthday: "Doğum Günü",
  bride: "Bride / Bekarlığa Veda",
  corporate: "Kurumsal Etkinlik",
  "brand-launch": "Marka Lansmanı",
  opening: "Açılış Etkinliği",
  cocktail: "Mezuniyet",
  wedding: "Düğün",
  engagement: "Nişan",
  "kina-gecesi": "Kına Gecesi",
};

export async function submitArtistBooking(data: ArtistBookingData): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("inquiries").insert({
    event_type: data.eventType || "other",
    event_date: data.eventDate || null,
    guest_type: null,
    event_sections: {
      artistBooking: {
        artistId: data.artistId,
        artistName: data.artistName,
        // Step 1
        country: data.country,
        city: data.city,
        venueName: data.venueName,
        venueSocial: data.venueSocial,
        isTicketed: data.isTicketed,
        ticketPrice: data.ticketPrice,
        venueCapacity: data.venueCapacity,
        sponsors: data.sponsors,
        // Step 2
        performanceType: data.performanceType,
        setDuration: data.setDuration,
        doorOpenTime: data.doorOpenTime,
        stageTime: data.stageTime,
        curfew: data.curfew,
        openingDj: data.openingDj,
        closingDj: data.closingDj,
        otherPerformers: data.otherPerformers,
        // Step 3
        mixerModel: data.mixerModel,
        cdjModel: data.cdjModel,
        soundSystem: data.soundSystem,
        hasMonitor: data.hasMonitor,
        // Step 4
        budget: data.budget,
        accommodation: data.accommodation,
        transfer: data.transfer,
        // Step 5
        specialRequests: data.specialRequests,
      },
    },
    moment_selections: {},
    services: ["artist_booking", `artist:${data.artistId}`],
    contact: {
      name: data.name,
      surname: data.surname,
      email: data.email,
      phone: data.phone,
      ...(data.company ? { company: data.company } : {}),
    },
    status: "new",
  });

  if (error) throw new Error(error.message);

  const eventTypeLabel = BOOKING_EVENT_LABELS[data.eventType] ?? data.eventType;

  await Promise.all([
    sendArtistBookingNotification({
      name: data.name,
      surname: data.surname,
      email: data.email,
      phone: data.phone,
      company: data.company,
      artistName: data.artistName,
      eventType: eventTypeLabel,
      eventDate: data.eventDate || undefined,
      country: data.country,
      city: data.city,
      venueName: data.venueName,
      venueSocial: data.venueSocial,
      isTicketed: data.isTicketed,
      ticketPrice: data.ticketPrice,
      venueCapacity: data.venueCapacity,
      sponsors: data.sponsors,
      performanceType: data.performanceType,
      setDuration: data.setDuration,
      doorOpenTime: data.doorOpenTime,
      stageTime: data.stageTime,
      curfew: data.curfew,
      openingDj: data.openingDj,
      closingDj: data.closingDj,
      otherPerformers: data.otherPerformers,
      mixerModel: data.mixerModel,
      cdjModel: data.cdjModel,
      soundSystem: data.soundSystem,
      hasMonitor: data.hasMonitor,
      budget: data.budget,
      accommodation: data.accommodation,
      transfer: data.transfer,
      specialRequests: data.specialRequests,
    }),
    sendArtistBookingConfirmation({
      name: data.name,
      email: data.email,
      artistName: data.artistName,
      eventType: eventTypeLabel,
      eventDate: data.eventDate || undefined,
    }),
  ]);
}
