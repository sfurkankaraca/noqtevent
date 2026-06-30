"use server";

import { createServiceClient } from "@/lib/supabase";
import { eventTypeLabel } from "@/lib/eventTypeLabels";
import { sendArtistBookingNotification, sendArtistBookingConfirmation } from "@/lib/email";
import type { ArtistBookingData } from "@/components/artist-booking/ArtistBookingWizard";

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
        city: data.city,
        venueName: data.venueName,
        venueCapacity: data.venueCapacity,
        setDuration: data.setDuration,
        doorOpenTime: data.doorOpenTime,
        stageTime: data.stageTime,
        curfew: data.curfew,
        otherPerformers: data.otherPerformers,
        mixerModel: data.mixerModel,
        cdjModel: data.cdjModel,
        soundSystem: data.soundSystem,
        hasMonitor: data.hasMonitor,
        budget: data.budget,
        accommodation: data.accommodation,
        transfer: data.transfer,
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

  await Promise.all([
    sendArtistBookingNotification({
      name: data.name,
      surname: data.surname,
      email: data.email,
      phone: data.phone,
      company: data.company,
      artistName: data.artistName,
      eventType: eventTypeLabel(data.eventType),
      eventDate: data.eventDate || undefined,
      city: data.city,
      venueName: data.venueName,
      venueCapacity: data.venueCapacity,
      setDuration: data.setDuration,
      budget: data.budget,
      accommodation: data.accommodation,
      transfer: data.transfer,
      specialRequests: data.specialRequests,
    }),
    sendArtistBookingConfirmation({
      name: data.name,
      email: data.email,
      artistName: data.artistName,
      eventType: eventTypeLabel(data.eventType),
      eventDate: data.eventDate || undefined,
    }),
  ]);
}
