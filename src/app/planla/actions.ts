"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { type PlannerData } from "@/components/planner/PlannerStore";
import { sendInquiryNotification, sendInquiryConfirmation } from "@/lib/email";
import { eventTypeLabel } from "@/lib/eventTypeLabels";
import { rateLimit } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitInquiry(
  data: PlannerData
): Promise<{ availabilityWarning: boolean }> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { ok } = rateLimit(ip, "inquiry", { max: 5, windowMs: 60 * 60_000 });
  if (!ok) throw new Error("Çok fazla istek. Lütfen daha sonra tekrar deneyin.");

  if (!data.name?.trim()) throw new Error("Ad zorunludur.");
  if (!data.email || !EMAIL_RE.test(data.email.trim())) throw new Error("Geçerli bir e-posta adresi girin.");

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

  // Müşterinin seçtiği sanatçıların isimleri (bildirim e-postası için)
  let selectedDjNames: string[] = [];
  if (data.selectedDjIds?.length) {
    const { data: picked } = await supabase
      .from("dj_profiles")
      .select("name")
      .in("id", data.selectedDjIds);
    selectedDjNames = (picked ?? []).map((d) => d.name as string);
  }

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

  await Promise.all([
    sendInquiryNotification({
      name: data.name,
      surname: data.surname,
      email: data.email,
      phone: data.phone,
      eventType: eventTypeLabel(data.eventType),
      eventDate: data.eventDate || undefined,
      services: data.services,
      selectedDjs: selectedDjNames,
    }),
    sendInquiryConfirmation({
      name: data.name,
      email: data.email,
      eventType: eventTypeLabel(data.eventType),
      eventDate: data.eventDate || undefined,
    }),
  ]);

  return { availabilityWarning };
}
