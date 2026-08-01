"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isEntityMember } from "@/lib/panel/queries";

// Hesaplı onay kutusu (/panel/onaylar): karşı taraf (counterparty) owner/
// manager/staff'ı Onayla/Reddet basar. Durum geçişi supply_events_guard
// trigger'ı yüzünden yalnız service_role'den mümkün (bkz. migration) — bu
// action önce kullanıcının GERÇEKTEN karşı tarafın üyesi olduğunu doğrular,
// sonra service client'la geçişi yapar.

export async function approveSupplyEventAction(formData: FormData): Promise<void> {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const eventId = String(formData.get("eventId") ?? "");
  const supabase = createServiceClient();
  const { data: event, error: fetchError } = await supabase
    .from("supply_events")
    .select("id, counterparty_entity_id, status")
    .eq("id", eventId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!event || event.status !== "pending_counterparty") throw new Error("Etkinlik onay bekleyen durumda değil.");
  if (!event.counterparty_entity_id) throw new Error("Bu etkinliğin onaylanacak bir karşı tarafı yok.");

  const member = await isEntityMember(user.id, event.counterparty_entity_id, ["owner", "manager", "staff"]);
  if (!member) throw new Error("Bu etkinliği onaylama yetkiniz yok.");

  const { error } = await supabase
    .from("supply_events")
    .update({ status: "confirmed" })
    .eq("id", eventId)
    .eq("status", "pending_counterparty");
  if (error) throw new Error(error.message);

  redirect("/panel/onaylar?islem=onaylandi");
}

export async function rejectSupplyEventAction(formData: FormData): Promise<void> {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const eventId = String(formData.get("eventId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || null;
  const supabase = createServiceClient();
  const { data: event, error: fetchError } = await supabase
    .from("supply_events")
    .select("id, counterparty_entity_id, status")
    .eq("id", eventId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!event || event.status !== "pending_counterparty") throw new Error("Etkinlik onay bekleyen durumda değil.");
  if (!event.counterparty_entity_id) throw new Error("Bu etkinliğin reddedilecek bir karşı tarafı yok.");

  const member = await isEntityMember(user.id, event.counterparty_entity_id, ["owner", "manager", "staff"]);
  if (!member) throw new Error("Bu etkinliği reddetme yetkiniz yok.");

  const { error } = await supabase
    .from("supply_events")
    .update({ status: "rejected", rejected_reason: reason })
    .eq("id", eventId)
    .eq("status", "pending_counterparty");
  if (error) throw new Error(error.message);

  redirect("/panel/onaylar?islem=reddedildi");
}
