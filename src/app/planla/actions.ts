"use server";

import { createServiceClient } from "@/lib/supabase";
import { type PlannerData } from "@/components/planner/PlannerStore";
import { sendInquiryNotification } from "@/lib/email";

export async function submitInquiry(
  data: PlannerData
): Promise<{ availabilityWarning: boolean }> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("inquiries").insert({
    event_type: data.eventType,
    event_date: data.eventDate || null,
    guest_type: data.guestType,
    event_sections: data.eventSections ?? {},
    moment_selections: data.momentSelections ?? {},
    services: data.services,
    contact: {
      name: data.name,
      surname: data.surname,
      email: data.email,
      phone: data.phone,
    },
  });

  if (error) throw new Error(error.message);

  // Check DJ availability — only warn if no active DJ is free on the requested date
  let availabilityWarning = false;
  if (data.eventDate) {
    const { data: djs } = await supabase
      .from("dj_profiles")
      .select("busy_dates")
      .eq("is_active", true);

    if (djs && djs.length > 0) {
      const allBusy = djs.every((dj) =>
        (dj.busy_dates as string[] ?? []).includes(data.eventDate)
      );
      availabilityWarning = allBusy;
    }
  }

  await sendInquiryNotification({
    name: data.name,
    surname: data.surname,
    email: data.email,
    phone: data.phone,
    eventType: data.eventType,
    eventDate: data.eventDate || undefined,
    services: data.services,
  });

  return { availabilityWarning };
}
