"use server";

import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { deleteFromR2 } from "@/lib/r2";
import { revalidatePath } from "next/cache";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Türkçe/aksanlı karakterleri sadeleştirip URL-güvenli slug üretir (ör. "Şükrü Öz" → "sukru-oz")
function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ü/g, "u").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function upsertMemoryEvent(formData: FormData): Promise<{ id: string }> {
  await requireAdmin();
  const id = formData.get("id") as string | null;

  const slug = slugify(formData.get("slug") as string);
  const title = (formData.get("title") as string).trim();

  if (!title) throw new Error("Etkinlik adı zorunludur.");
  if (!slug || !SLUG_RE.test(slug)) throw new Error("Geçerli bir URL (slug) girin — yalnızca harf, rakam ve tire.");

  const visibilityRaw = formData.get("gallery_visibility") as string | null;
  const gallery_visibility = visibilityRaw === "couple" ? "couple" : "guests";

  const base = {
    slug,
    title,
    description: (formData.get("description") as string) || null,
    is_active: formData.get("is_active") === "on",
  };
  // Galeri/e-posta sütunları migration'a bağlı; yoksa yazma hata verir, o alanlar atlanır
  const gallery_token = randomBytes(9).toString("hex");
  const couple_email = (formData.get("couple_email") as string)?.trim() || null;
  const payload = { ...base, gallery_visibility, couple_email };

  // gallery_*/couple_email sütunu bulunamadı hatasında (migration çalışmamış) o alanları at
  const isMissingGalleryCol = (msg?: string) =>
    !!msg && (msg.includes("gallery_visibility") || msg.includes("gallery_token") || msg.includes("couple_email"));

  const supabase = createServiceClient();

  if (id) {
    let { error } = await supabase.from("memory_events").update(payload).eq("id", id);
    if (error && isMissingGalleryCol(error.message)) {
      ({ error } = await supabase.from("memory_events").update(base).eq("id", id));
    }
    if (error) {
      throw new Error(
        error.code === "23505" ? `Bu URL (${slug}) zaten kullanımda. Farklı bir slug deneyin.` : error.message
      );
    }
    revalidatePath("/admin/memory");
    revalidatePath(`/admin/memory/${id}`);
    return { id };
  }

  let { data, error } = await supabase
    .from("memory_events")
    .insert({ ...payload, gallery_token })
    .select("id")
    .single();
  if (error && isMissingGalleryCol(error.message)) {
    ({ data, error } = await supabase.from("memory_events").insert(base).select("id").single());
  }
  if (error || !data) {
    throw new Error(
      error?.code === "23505" ? `Bu URL (${slug}) zaten kullanımda. Farklı bir slug deneyin.` : error?.message ?? "Etkinlik oluşturulamadı."
    );
  }
  revalidatePath("/admin/memory");
  return { id: data.id };
}

export async function deleteMemoryEvent(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();

  // R2'deki dosyalar DB satırı silindiğinde (cascade) otomatik temizlenmez —
  // önce depolamadan sil, sonra event'i (ve cascade ile yükleme kayıtlarını) sil
  const { data: uploads } = await supabase.from("memory_uploads").select("file_path").eq("event_id", id);
  await Promise.all((uploads ?? []).map((u) => deleteFromR2(u.file_path).catch(() => {})));

  const { error } = await supabase.from("memory_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/memory");
}

export async function deleteUpload(id: string, filePath: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await deleteFromR2(filePath);
  await supabase.from("memory_uploads").delete().eq("id", id);
}
