"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function markPaymentInvoiced(paymentId: string, invoiceNote: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("booking_payments")
    .update({ invoiced: true, invoiced_at: new Date().toISOString(), invoice_note: invoiceNote?.trim().slice(0, 200) || null })
    .eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/finans");
}

export async function markPaymentUninvoiced(paymentId: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("booking_payments")
    .update({ invoiced: false, invoiced_at: null, invoice_note: null })
    .eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/finans");
}
