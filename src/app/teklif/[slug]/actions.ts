"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { TERMS_VERSION } from "@/lib/bookingTerms";

export async function acceptOffer(data: {
  bookingId: string;
  slug: string;
  name: string;
  email: string | null;
  plan: "cash" | "prepay";
  agreedPrice: number;
}) {
  const supabase = createServiceClient();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? null;
  const userAgent = hdrs.get("user-agent") ?? null;

  const { error: agreementError } = await supabase.from("booking_agreements").insert({
    booking_id: data.bookingId,
    accepted_name: data.name,
    accepted_email: data.email,
    payment_plan: data.plan,
    agreed_price: data.agreedPrice,
    terms_version: TERMS_VERSION,
    ip_address: ip,
    user_agent: userAgent,
  });
  if (agreementError) throw new Error(agreementError.message);

  const { data: current } = await supabase.from("bookings").select("status").eq("id", data.bookingId).single();
  const nextStatus = current && ["draft", "offer_sent"].includes(current.status) ? "confirmed" : current?.status;

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ payment_plan: data.plan, status: nextStatus })
    .eq("id", data.bookingId);
  if (bookingError) throw new Error(bookingError.message);

  revalidatePath(`/teklif/${data.slug}`);
  revalidatePath(`/admin/bookings/${data.bookingId}`);
}
