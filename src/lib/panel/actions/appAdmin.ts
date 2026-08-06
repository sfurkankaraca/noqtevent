"use server";

import { redirect } from "next/navigation";
import { requirePanelAdminUser } from "@/lib/panel/adminAuth";
import { setUserBanned, setFeedbackStatus, FEEDBACK_STATUSES, reviewVerificationAdmin } from "@/lib/panel/appAdminQueries";
import {
  callAdminDeleteUser,
  callModerateReport,
  ModerateReportUnverifiedError,
  type ModerateReportAction,
} from "@/lib/panel/eventmatchAdminApi";

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

const MODERATE_REPORT_ACTIONS: readonly ModerateReportAction[] = ["review", "ban", "remove_content"];

// Şikayet moderasyonu — DOĞRUDAN Firestore yazmaz, eventmatch'in
// moderateReport Cloud Function'ını çağırır (bkz. eventmatchAdminApi.ts başı):
// sahiplik/kanıt doğrulaması yalnız orada yapılıyor. `force` gönderilmeden
// doğrulanamayan bir ban denendiğinde fonksiyon 409 döner; burada bu hata
// yutulmaz, sayfaya "yine de uygula?" uyarısı olarak geri taşınır — Flutter
// tarafındaki `_confirmUnverified` diyaloğunun web (redirect + banner)
// karşılığı.
export async function moderateReportAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const reportId = String(formData.get("reportId") ?? "");
  const action = String(formData.get("action") ?? "");
  const force = formData.get("force") === "true";
  if (!reportId) throw new Error("reportId zorunlu.");
  if (!MODERATE_REPORT_ACTIONS.includes(action as ModerateReportAction)) throw new Error("Geçersiz aksiyon.");

  const listUrl = "/panel/admin/uygulama/sikayetler";
  try {
    await callModerateReport(reportId, action as ModerateReportAction, { force });
  } catch (err) {
    if (err instanceof ModerateReportUnverifiedError) {
      const params = new URLSearchParams({
        uyari: "1",
        reportId,
        reason: err.reason,
        requiresForce: String(err.requiresForce),
        targetExists: String(err.targetExists),
      });
      if (err.contentPath) params.set("contentPath", err.contentPath);
      redirect(`${listUrl}?${params.toString()}`);
    }
    // Diğer hatalar (env eksik, ağ, Cloud Function 500 vb.) SESSİZCE
    // yutulmaz — Next.js hata sınırına düşer, kurucu boş bir tıklama yerine
    // gerçek hatayı görür.
    throw err;
  }

  redirect(`${listUrl}?islendi=1`);
}

// Kimlik doğrulama incelemesi — doğrudan Firestore yazımı BİLİNÇLİ (bkz.
// appAdminQueries.ts::reviewVerificationAdmin başındaki not): eventmatch
// tarafında da bu karar bir Cloud Function'dan değil, doğrudan (rules
// üzerinden isFounder() ile korunan) bir Firestore yazımından geliyor.
export async function reviewVerificationAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const uid = String(formData.get("uid") ?? "");
  const approve = formData.get("approve") === "true";
  if (!uid) throw new Error("uid zorunlu.");

  await reviewVerificationAdmin(uid, approve);

  redirect("/panel/admin/uygulama/dogrulama?islendi=1");
}
