// Panel zenginleştirme rotalarının (spotify/youtube search+apply) ortak
// yetki kontrolü — src/app/api/panel/media/upload/route.ts'teki desenin
// AYNISI (admin VEYA ilgili entity'nin owner/manager'ı; staff hariç, profil
// bilgisi düzenlemek staff işi değil), dört rotada tekrarlamamak için
// buraya çıkarıldı.

import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { isEntityMember } from "@/lib/panel/queries";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EnrichAuthResult = { ok: true } | { ok: false; status: 401 | 403; error: string };

// Çağıran, entityId'nin GEÇERLİ bir UUID olduğunu önceden kontrol etmiş olmalı.
export async function requireEntityEditAccess(entityId: string): Promise<EnrichAuthResult> {
  const user = await getPanelUser();
  if (!user) return { ok: false, status: 401, error: "Bu işlem için panel oturumu gerekli." };

  const admin = await isPanelAdmin();
  if (admin) return { ok: true };

  const member = await isEntityMember(user.id, entityId, ["owner", "manager"]);
  if (!member) return { ok: false, status: 403, error: "Bu profili düzenleme yetkiniz yok." };

  return { ok: true };
}
