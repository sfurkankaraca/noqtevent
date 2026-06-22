"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { sendContactNotification } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  const { ok } = rateLimit(ip, "contact", { max: 5, windowMs: 60 * 60_000 }); // 5/saat
  if (!ok) throw new Error("Çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin.");

  const name = (formData.get("name") as string).trim().slice(0, 120);
  const email = (formData.get("email") as string).trim().toLowerCase().slice(0, 200);
  const eventType = (formData.get("eventType") as string).trim().slice(0, 100);
  const message = (formData.get("message") as string).trim().slice(0, 3000);

  if (!name || !email || !message) throw new Error("Ad, e-posta ve mesaj zorunludur.");
  if (!EMAIL_RE.test(email)) throw new Error("Geçerli bir e-posta adresi girin.");

  const supabase = createServiceClient();
  await supabase.from("contact_messages").insert({
    name, email,
    event_type: eventType || null,
    message,
  });

  await sendContactNotification({ name, email, eventType: eventType || undefined, message });
}
