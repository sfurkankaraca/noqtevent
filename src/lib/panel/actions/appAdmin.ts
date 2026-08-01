"use server";

import { redirect } from "next/navigation";
import { requirePanelAdminUser } from "@/lib/panel/adminAuth";
import { setUserBanned, setFeedbackStatus, FEEDBACK_STATUSES } from "@/lib/panel/appAdminQueries";
import { callAdminDeleteUser } from "@/lib/panel/eventmatchAdminApi";

// Uygulama yönetimi (eventmatch Firestore) action'ları — hepsi
// requirePanelAdminUser() ile açılıyor (bkz. src/lib/panel/actions/admin.ts
// deseniyle aynı: kapı kontrolü her action'ın en başında).

function safeAdminRedirect(redirectTo: FormDataEntryValue | null, allowedPrefix: string, fallback: string): never {
  const value = String(redirectTo ?? "");
  redirect(value.startsWith(allowedPrefix) ? value : fallback);
}

export async function toggleUserBannedAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const userId = String(formData.get("userId") ?? "");
  const nextBanned = formData.get("nextValue") === "true";
  if (!userId) throw new Error("userId zorunlu.");

  await setUserBanned(userId, nextBanned);

  safeAdminRedirect(formData.get("redirectTo"), "/panel/admin/uygulama/kullanicilar", "/panel/admin/uygulama/kullanicilar");
}

export async function deleteAppUserAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("userId zorunlu.");

  await callAdminDeleteUser(userId);

  safeAdminRedirect(
    formData.get("redirectTo"),
    "/panel/admin/uygulama/kullanicilar",
    "/panel/admin/uygulama/kullanicilar?silindi=1"
  );
}

export async function setFeedbackStatusAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const feedbackId = String(formData.get("feedbackId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!feedbackId) throw new Error("feedbackId zorunlu.");
  if (!(FEEDBACK_STATUSES as readonly string[]).includes(status)) throw new Error("Geçersiz durum.");

  await setFeedbackStatus(feedbackId, status as (typeof FEEDBACK_STATUSES)[number]);

  safeAdminRedirect(
    formData.get("redirectTo"),
    "/panel/admin/uygulama/geribildirim",
    `/panel/admin/uygulama/geribildirim?sekme=${encodeURIComponent(status)}`
  );
}
