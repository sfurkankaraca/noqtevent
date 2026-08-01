"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { generateClaimCode } from "@/lib/panel/tokens";
import { rateLimit } from "@/lib/rateLimit";
import { getArtistByEntityId, getVenueByEntityId } from "@/lib/panel/queries";

// Sahiplenme başvurusu (TASARIM §3.4, §0.7): IG DM kod yöntemi. claims
// tablosuna yalnız service_role/admin yazabilir (RLS) — bu action kimlik
// doğrulamasını kendi yapıp service client'la yazıyor, tıpkı migration
// yorumunda öngörüldüğü gibi ("panel API'si service_role üzerinden yürür").
export async function startClaimAction(formData: FormData): Promise<void> {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const entityId = String(formData.get("entityId") ?? "");
  const kind = String(formData.get("kind") ?? "") as "venue" | "artist";
  if (!entityId || (kind !== "venue" && kind !== "artist")) {
    throw new Error("Geçersiz sahiplenme başvurusu.");
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { ok } = rateLimit(`${ip}:${user.id}`, "panel-claim", { max: 10, windowMs: 60 * 60_000 });
  if (!ok) throw new Error("Çok fazla başvuru yapıldı, lütfen daha sonra tekrar deneyin.");

  const instagramHandle =
    kind === "venue"
      ? (await getVenueByEntityId(entityId))?.instagram_handle
      : (await getArtistByEntityId(entityId))?.links?.instagram;

  const code = generateClaimCode();
  const supabase = createServiceClient();
  const { error } = await supabase.from("claims").insert({
    entity_id: entityId,
    claimant_user_id: user.id,
    method: instagramHandle ? "ig_dm_code" : "manual",
    code,
    code_sent_to: instagramHandle ? `instagram:${instagramHandle}` : null,
    status: "pending",
  });
  if (error) throw new Error(error.message);

  redirect(`/panel/sahiplen/${kind}/${entityId}?basvuru=1`);
}
