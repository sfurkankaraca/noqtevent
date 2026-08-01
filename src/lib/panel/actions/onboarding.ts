"use server";

import { redirect } from "next/navigation";
import { createPanelServerClient, getPanelUser } from "@/lib/panel/supabaseServer";
import type { RoleSide } from "@/lib/panel/types";

// Onboarding anketi (TASARIM §2.7) — claim sonrası opsiyonel. Bu, panelde
// anon key + RLS ile yazılan az sayıdaki örnekten biri: "Members submit
// onboarding survey" politikası zaten auth.uid() = created_by_user_id VE
// entity üyeliği şartını DB seviyesinde zorunlu kılıyor, service_role'e
// gerek yok — RLS tam olarak istenen kısıtı sağlıyor.
export async function submitOnboardingSurveyAction(formData: FormData): Promise<void> {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const entityId = String(formData.get("entityId") ?? "");
  const roleSide = String(formData.get("roleSide") ?? "") as RoleSide;
  if (!entityId || !["venue", "artist", "manager"].includes(roleSide)) {
    throw new Error("Geçersiz anket başvurusu.");
  }

  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("q_") && typeof value === "string" && value.trim()) {
      answers[key.slice(2)] = value.trim().slice(0, 1000);
    }
  }

  const supabase = await createPanelServerClient();
  const { error } = await supabase.from("onboarding_surveys").insert({
    entity_id: entityId,
    role_side: roleSide,
    answers,
    created_by_user_id: user.id,
  });
  if (error) throw new Error(error.message);

  redirect("/panel?anket=tesekkurler");
}
