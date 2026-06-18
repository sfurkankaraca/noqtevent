"use server";

import { createServiceClient } from "@/lib/supabase";
import { sendContactNotification } from "@/lib/email";

export async function submitContactMessage(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim();
  const eventType = (formData.get("eventType") as string).trim();
  const message = (formData.get("message") as string).trim();

  const supabase = createServiceClient();
  await supabase.from("contact_messages").insert({ name, email, event_type: eventType || null, message });

  await sendContactNotification({ name, email, eventType: eventType || undefined, message });
}
