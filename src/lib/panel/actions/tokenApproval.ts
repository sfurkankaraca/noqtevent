"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { hashToken } from "@/lib/panel/tokens";
import { rateLimit } from "@/lib/rateLimit";

// Hesapsız tek kullanımlık onay linki (/onay/[token], TASARIM §3.4). Ham
// token DB'de tutulmuyor — sha256 hash ile aranıyor. Token tahmin saldırısına
// karşı IP başına deneme sınırı (token zaten 24 rastgele byte, pratikte
// tahmin imkânsız — bu ek bir savunma katmanı).
async function guardRate(): Promise<void> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { ok } = rateLimit(ip, "panel-token-approval", { max: 20, windowMs: 15 * 60_000 });
  if (!ok) throw new Error("Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin.");
}

async function loadValidToken(token: string) {
  const supabase = createServiceClient();
  const tokenHash = hashToken(token);
  const { data: row, error } = await supabase
    .from("approval_tokens")
    .select("id, supply_event_id, expires_at, used_at, action_scope")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Bu onay bağlantısı geçersiz.");
  if (row.used_at) throw new Error("Bu onay bağlantısı daha önce kullanılmış.");
  if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("Bu onay bağlantısının süresi dolmuş.");
  if (row.action_scope !== "confirm_event") throw new Error("Bu bağlantının kapsamı desteklenmiyor.");
  return { supabase, row };
}

export async function approveByTokenAction(formData: FormData): Promise<void> {
  await guardRate();
  const token = String(formData.get("token") ?? "");
  const { supabase, row } = await loadValidToken(token);

  const { data: event } = await supabase
    .from("supply_events")
    .select("status")
    .eq("id", row.supply_event_id)
    .maybeSingle();
  if (!event || event.status !== "pending_counterparty") {
    throw new Error("Bu etkinlik artık onay bekleyen durumda değil.");
  }

  const { error: updateError } = await supabase
    .from("supply_events")
    .update({ status: "confirmed" })
    .eq("id", row.supply_event_id)
    .eq("status", "pending_counterparty");
  if (updateError) throw new Error(updateError.message);

  await supabase.from("approval_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);

  redirect(`/onay/${encodeURIComponent(token)}?sonuc=onaylandi`);
}

export async function rejectByTokenAction(formData: FormData): Promise<void> {
  await guardRate();
  const token = String(formData.get("token") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || null;
  const { supabase, row } = await loadValidToken(token);

  const { data: event } = await supabase
    .from("supply_events")
    .select("status")
    .eq("id", row.supply_event_id)
    .maybeSingle();
  if (!event || event.status !== "pending_counterparty") {
    throw new Error("Bu etkinlik artık onay bekleyen durumda değil.");
  }

  const { error: updateError } = await supabase
    .from("supply_events")
    .update({ status: "rejected", rejected_reason: reason })
    .eq("id", row.supply_event_id)
    .eq("status", "pending_counterparty");
  if (updateError) throw new Error(updateError.message);

  await supabase.from("approval_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);

  redirect(`/onay/${encodeURIComponent(token)}?sonuc=reddedildi`);
}
