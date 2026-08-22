"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { sendBookingDeliveryEmail, sendOfferEmail as sendOfferEmailLib, sendPaymentReceivedEmails } from "@/lib/email";
import { calcDuePayment } from "@/lib/paymentPlan";
import { createAndStoreContract } from "@/lib/contract";
import { fetchBookingItems, itemsArtistNames } from "@/lib/bookingItems";
import { isMissingPackageSchema, PACKAGE_MIGRATION_HINT } from "@/lib/offerPackages";

const BASE = () => process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

export type BookingStatus =
  | "draft" | "offer_sent" | "confirmed" | "contracted"
  | "deposit_paid" | "full_paid" | "completed" | "cancelled";

export type BookingItemPayload = {
  kind: "artist" | "service";
  artist_id?: string | null;
  title: string;
  description?: string | null;
  amount: number;
};

export type BookingPayload = {
  id?: string;
  inquiry_id?: string | null;
  artist_id?: string | null;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  event_duration_hours?: number | null;
  venue_name?: string | null;
  venue_city?: string | null;
  venue_address?: string | null;
  fee: number;
  commission_rate: number;
  deposit_rate: number;
  prepay_markup_rate: number;
  travel_required: boolean;
  accommodation_required: boolean;
  advance_amount: number;
  notes?: string | null;
  internal_notes?: string | null;
  // Teklif kalemleri (çoklu sanatçı/hizmet) — undefined ise dokunulmaz
  items?: BookingItemPayload[];
};

export type UpsertBookingResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

// Postgres/PostgREST hatalarını admin'in anlayacağı Türkçe mesaja çevirir.
// Ham mesaj da eklenir — teşhis için gerekli.
function dbErrorMessage(message: string, context: string): string {
  const m = message ?? "";
  if (/invalid input syntax for type uuid/i.test(m)) {
    return `${context}: geçersiz kimlik (UUID) değeri gönderildi — sanatçı/talep seçimini kontrol edin. (${m})`;
  }
  if (/violates foreign key constraint/i.test(m)) {
    return `${context}: seçilen sanatçı veya talep kaydı veritabanında bulunamadı. (${m})`;
  }
  if (/violates check constraint/i.test(m)) {
    return `${context}: gönderilen değer izin verilen aralık/listede değil. (${m})`;
  }
  if (/violates not-null constraint/i.test(m)) {
    return `${context}: zorunlu bir alan boş bırakıldı. (${m})`;
  }
  if (/numeric field overflow/i.test(m)) {
    return `${context}: girilen tutar çok büyük. (${m})`;
  }
  if (/could not find the .* column|schema cache/i.test(m)) {
    return `${context}: veritabanı şeması güncel değil — bekleyen migration'ları Supabase'de çalıştırın. (${m})`;
  }
  return `${context}: ${m}`;
}

// NOT: Bu action bilerek throw ETMEZ. Next.js production'da Server Action'dan
// fırlatılan hata mesajlarını gizler ("An error occurred..."), böylece admin
// paneli sessizce başarısız olur. Sonucu döndürerek gerçek hata forma yansır.
export async function upsertBooking(payload: BookingPayload): Promise<UpsertBookingResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Yetkisiz erişim — admin hesabıyla giriş yapmanız gerekiyor." };
  }

  const supabase = createServiceClient();
  const { id, items, ...data } = payload;

  // Toplam ücret formdan manuel gelir (kalem bazlı tutar opsiyonel).
  // Ana sanatçı boşsa ilk sanatçı kaleminden atanır (takvim/finans görünümleri için)
  if (items && items.length > 0 && !data.artist_id) {
    data.artist_id = items.find((i) => i.kind === "artist" && i.artist_id)?.artist_id ?? null;
  }

  let bookingId = id;
  if (id) {
    const { error } = await supabase.from("bookings").update(data).eq("id", id);
    if (error) {
      if (error.message.includes("prepay_markup_rate")) {
        const { prepay_markup_rate: _pmr, ...safe } = data;
        const { error: e2 } = await supabase.from("bookings").update(safe).eq("id", id);
        if (e2) return { ok: false, error: dbErrorMessage(e2.message, "Booking güncellenemedi") };
      } else {
        return { ok: false, error: dbErrorMessage(error.message, "Booking güncellenemedi") };
      }
    }
  } else {
    let { data: inserted, error } = await supabase
      .from("bookings").insert(data).select("id").single();
    if (error?.message.includes("prepay_markup_rate")) {
      const { prepay_markup_rate: _pmr, ...safe } = data;
      ({ data: inserted, error } = await supabase.from("bookings").insert(safe).select("id").single());
    }
    if (error) return { ok: false, error: dbErrorMessage(error.message, "Booking oluşturulamadı") };
    if (!inserted?.id) return { ok: false, error: "Booking oluşturulamadı: veritabanı kayıt kimliği döndürmedi." };
    bookingId = inserted.id;
  }

  if (!bookingId) return { ok: false, error: "Booking kimliği belirlenemedi." };

  if (items !== undefined) {
    const { error: delError } = await supabase
      .from("booking_items").delete().eq("booking_id", bookingId);
    if (delError) {
      // Migration henüz çalıştırılmadıysa: kalemsiz kayıtları engelleme, kalemli kayıtta net hata ver
      if (items.length === 0) {
        revalidatePath("/admin/bookings");
        revalidatePath(`/admin/bookings/${bookingId}`);
        return { ok: true, id: bookingId };
      }
      return {
        ok: false,
        error: /booking_items|relation|schema/i.test(delError.message)
          ? "Booking kaydedildi ama teklif kalemleri yazılamadı: booking_items tablosu bulunamadı — supabase/migrations altındaki migration'ları Supabase'de çalıştırın."
          : dbErrorMessage(delError.message, "Teklif kalemleri güncellenemedi"),
      };
    }
    if (items.length > 0) {
      const { error: insError } = await supabase.from("booking_items").insert(
        items.map((it, i) => ({
          booking_id: bookingId,
          kind: it.kind,
          artist_id: it.kind === "artist" ? (it.artist_id ?? null) : null,
          title: it.title,
          description: it.description ?? null,
          amount: Number(it.amount) || 0,
          sort_order: i,
        }))
      );
      if (insError) return { ok: false, error: dbErrorMessage(insError.message, "Teklif kalemleri kaydedilemedi") };
    }
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true, id: bookingId };
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await requireAdmin();
  const supabase = createServiceClient();
  const extra: Record<string, unknown> = {};
  if (status === "contracted") extra.contract_signed_at = new Date().toISOString();
  const { error } = await supabase.from("bookings").update({ status, ...extra }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function addPayment(bookingId: string, data: {
  type: string; amount: number; direction: string; description?: string;
}) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("booking_payments").insert({
    booking_id: bookingId,
    ...data,
    status: "completed",
    paid_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/bookings/${bookingId}`);

  // Kapora/tam ödeme elle girildiğinde de müşteriye presskit + sözleşme içeren
  // ödeme makbuzu gitsin — iyzico callback'iyle aynı e-postayı kullanır.
  if (data.direction === "inbound" && (data.type === "deposit" || data.type === "full")) {
    sendManualPaymentReceipt(bookingId, data.amount).catch(console.error);
  }
}

async function sendManualPaymentReceipt(bookingId: string, amount: number) {
  const supabase = createServiceClient();
  const result = await supabase
    .from("bookings")
    .select("id, client_name, client_email, fee, payment_plan, deposit_rate, prepay_markup_rate, contract_url, dj_profiles(name, slug)")
    .eq("id", bookingId)
    .single();
  let booking = result.data;
  if (result.error?.message.includes("column")) {
    // prepay_markup_rate migration'ı henüz çalıştırılmadıysa onsuz dene
    const fallback = await supabase
      .from("bookings")
      .select("id, client_name, client_email, fee, payment_plan, deposit_rate, contract_url, dj_profiles(name, slug)")
      .eq("id", bookingId)
      .single();
    booking = fallback.data as typeof booking;
  }
  if (!booking) return;

  const { data: payments } = await supabase
    .from("booking_payments")
    .select("amount")
    .eq("booking_id", bookingId)
    .eq("direction", "inbound")
    .eq("status", "completed")
    .in("type", ["deposit", "full"]);
  const paidTotal = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const stillDue = calcDuePayment(booking, paidTotal);

  let contractUrl = booking.contract_url ?? null;
  if (!contractUrl) {
    const contract = await createAndStoreContract(booking.id).catch(() => null);
    contractUrl = contract?.contractUrl ?? null;
  }
  const artistSlug = (booking.dj_profiles as { slug?: string | null } | null)?.slug ?? null;

  await sendPaymentReceivedEmails({
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    artistName: (booking.dj_profiles as { name?: string } | null)?.name ?? "—",
    amount,
    kind: paidTotal > amount ? "remaining" : stillDue ? "deposit" : "full",
    remaining: stillDue?.amount ?? 0,
    bookingId: booking.id,
    cardLastFour: null,
    presskitUrl: artistSlug ? `${BASE()}/s/${artistSlug}` : null,
    contractUrl,
  });
}

export async function saveDelivery(bookingId: string, data: {
  slug: string;
  photos: string[];
  videos: string[];
  notes?: string | null;
}) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("bookings").update({
    delivery_slug: data.slug,
    delivery_photos: data.photos,
    delivery_videos: data.videos,
    delivery_notes: data.notes ?? null,
  }).eq("id", bookingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/teslimat/${data.slug}`);
}

export async function sendDelivery(bookingId: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name)")
    .eq("id", bookingId)
    .single();
  if (error || !booking) throw new Error(error?.message ?? "Booking bulunamadı");
  if (!booking.delivery_slug) throw new Error("Önce teslimat linkini oluşturun");

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  await sendBookingDeliveryEmail({
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    artistName: booking.dj_profiles?.name ?? "—",
    deliveryUrl: `${BASE}/teslimat/${booking.delivery_slug}`,
    photoCount: Array.isArray(booking.delivery_photos) ? booking.delivery_photos.length : 0,
    videoCount: Array.isArray(booking.delivery_videos) ? booking.delivery_videos.length : 0,
  });

  await supabase.from("bookings").update({ delivery_sent_at: new Date().toISOString() }).eq("id", bookingId);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function generateOfferLink(bookingId: string, slug: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("bookings").update({ offer_slug: slug }).eq("id", bookingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/teklif/${slug}`);
}

export async function sendOfferEmail(bookingId: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name)")
    .eq("id", bookingId)
    .single();
  if (error || !booking) throw new Error(error?.message ?? "Booking bulunamadı");
  if (!booking.offer_slug) throw new Error("Önce teklif linkini oluşturun");
  if (!booking.client_email) throw new Error("Müşteri e-postası yok");

  // Çoklu kalemli teklifte e-posta başlığında tüm sanatçılar geçsin
  const items = await fetchBookingItems(supabase, bookingId);
  const artistNames = itemsArtistNames(items);

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  await sendOfferEmailLib({
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    artistName: artistNames ?? booking.dj_profiles?.name ?? "—",
    offerUrl: `${BASE}/teklif/${booking.offer_slug}`,
    eventType: booking.event_type,
    eventDate: booking.event_date,
  });

  // Teklif geçerlilik süresi: gönderimden 10 gün sonra, ama etkinlikten en geç 1 gün önce
  const tenDaysOut = new Date(Date.now() + 10 * 24 * 60 * 60_000);
  let expiresAt = tenDaysOut;
  if (booking.event_date) {
    const dayBeforeEvent = new Date(new Date(booking.event_date).getTime() - 24 * 60 * 60_000);
    if (dayBeforeEvent < expiresAt) expiresAt = dayBeforeEvent;
  }

  const update: Record<string, unknown> = { offer_expires_at: expiresAt.toISOString() };
  if (booking.status === "draft") update.status = "offer_sent";
  const { error: updateError } = await supabase.from("bookings").update(update).eq("id", bookingId);
  if (updateError?.message.includes("column")) {
    // offer_expires_at migration'ı henüz çalıştırılmadıysa yalnızca durumu güncelle
    if (booking.status === "draft") await supabase.from("bookings").update({ status: "offer_sent" }).eq("id", bookingId);
  }
  revalidatePath(`/admin/bookings/${bookingId}`);
}

// Teklif sayfasında müşteriye sunulacak sanatçı adayları ve konsept kategorisi
export async function updateOfferOptions(
  bookingId: string,
  options: {
    artistIds: string[];
    conceptCategory: string | null;
    musicConceptIds?: string[];
    listPrice?: number | null;
    discountNote?: string | null;
  }
) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: booking } = await supabase.from("bookings").select("offer_slug, fee").eq("id", bookingId).single();

  const listPrice = options.listPrice == null || Number.isNaN(Number(options.listPrice)) || Number(options.listPrice) <= 0
    ? null
    : Math.round(Number(options.listPrice));
  if (listPrice !== null && booking && listPrice < Number(booking.fee ?? 0)) {
    throw new Error("Liste fiyatı, indirimli fiyattan (ücret) küçük olamaz.");
  }

  const update: Record<string, unknown> = {
    offer_artist_ids: options.artistIds,
    offer_concept_category: options.conceptCategory || null,
  };
  if (options.musicConceptIds !== undefined) update.offer_music_concept_ids = options.musicConceptIds;
  if (options.listPrice !== undefined) {
    update.list_price = listPrice;
    update.discount_note = options.discountNote?.trim() || null;
  }

  const { error } = await supabase.from("bookings").update(update).eq("id", bookingId);
  if (error) {
    if (error.message.includes("column")) {
      throw new Error(
        "Teklif seçenekleri migration'ı henüz Supabase'de çalıştırılmadı (20260723040000_add_offer_options.sql / 20260822120000_add_offer_discount_music_concepts.sql)."
      );
    }
    throw new Error(error.message);
  }
  revalidatePath(`/admin/bookings/${bookingId}`);
  if (booking?.offer_slug) revalidatePath(`/teklif/${booking.offer_slug}`);
}

// ── Çok seçenekli teklif (paketler) ─────────────────────────────────────────
// Admin bir booking için birden fazla paket tanımlar (ör. Klasik / Premium /
// Full Prodüksiyon). Müşteri teklif sayfasından birini seçince o paketin bedeli
// booking.fee'ye yazılır; sözleşme, PDF ve ödeme akışı değişmeden çalışır.

export type OfferPackagePayload = {
  id?: string | null;
  title: string;
  subtitle?: string | null;
  fee: number;
  is_recommended: boolean;
  lines: { title: string; description?: string | null; amount?: number | null }[];
};

export type SavePackagesResult = { ok: true } | { ok: false; error: string };

export async function saveOfferPackages(
  bookingId: string,
  packages: OfferPackagePayload[]
): Promise<SavePackagesResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Yetkisiz erişim — admin hesabıyla giriş yapmanız gerekiyor." };
  }

  const supabase = createServiceClient();

  const clean = packages
    .map((p, i) => ({
      title: p.title.trim(),
      subtitle: p.subtitle?.trim() || null,
      fee: Number(p.fee) || 0,
      is_recommended: Boolean(p.is_recommended),
      sort_order: i,
      lines: (p.lines ?? [])
        .map((l) => ({
          title: l.title?.trim() ?? "",
          description: l.description?.trim() || null,
          amount: l.amount === null || l.amount === undefined || l.amount === 0 ? null : Number(l.amount) || null,
        }))
        .filter((l) => l.title.length > 0),
    }))
    .filter((p) => p.title.length > 0);

  if (clean.some((p) => p.fee <= 0)) {
    return { ok: false, error: "Her paket için 0'dan büyük bir fiyat girin." };
  }

  const { data: booking } = await supabase
    .from("bookings").select("offer_slug").eq("id", bookingId).single();

  // Tam değiştirme: mevcut paketler silinip yenileri yazılır.
  // Seçili paket FK'sı ON DELETE SET NULL olduğundan seçim de sıfırlanır.
  const { error: delError } = await supabase
    .from("booking_offer_packages").delete().eq("booking_id", bookingId);
  if (delError) {
    return {
      ok: false,
      error: isMissingPackageSchema(delError.message)
        ? PACKAGE_MIGRATION_HINT
        : dbErrorMessage(delError.message, "Paketler güncellenemedi"),
    };
  }

  if (clean.length > 0) {
    const { error: insError } = await supabase
      .from("booking_offer_packages")
      .insert(clean.map((p) => ({ ...p, booking_id: bookingId })));
    if (insError) {
      return {
        ok: false,
        error: isMissingPackageSchema(insError.message)
          ? PACKAGE_MIGRATION_HINT
          : dbErrorMessage(insError.message, "Paketler kaydedilemedi"),
      };
    }
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  if (booking?.offer_slug) revalidatePath(`/teklif/${booking.offer_slug}`);
  return { ok: true };
}

// Admin, müşteri adına paketi kesinleştirir (telefonda karar verildiyse)
export async function applyOfferPackage(
  bookingId: string,
  packageId: string
): Promise<SavePackagesResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Yetkisiz erişim — admin hesabıyla giriş yapmanız gerekiyor." };
  }

  const supabase = createServiceClient();
  const { data: pkg, error } = await supabase
    .from("booking_offer_packages")
    .select("id, fee, booking_id")
    .eq("id", packageId)
    .eq("booking_id", bookingId)
    .single();
  if (error || !pkg) {
    return { ok: false, error: error ? dbErrorMessage(error.message, "Paket bulunamadı") : "Paket bulunamadı." };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      fee: Number(pkg.fee) || 0,
      selected_package_id: pkg.id,
      package_selected_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
  if (updateError) {
    return {
      ok: false,
      error: isMissingPackageSchema(updateError.message)
        ? PACKAGE_MIGRATION_HINT
        : dbErrorMessage(updateError.message, "Paket uygulanamadı"),
    };
  }

  const { data: booking } = await supabase
    .from("bookings").select("offer_slug").eq("id", bookingId).single();
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  if (booking?.offer_slug) revalidatePath(`/teklif/${booking.offer_slug}`);
  return { ok: true };
}

export async function deleteBooking(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("bookings").delete().eq("id", id);
  revalidatePath("/admin/bookings");
}

// Booking'i iptal eder; refundAmount > 0 ise iyzico ile tahsil edilmişse
// otomatik online iade dener, değilse (banka havalesi) manuel iade kaydı açar.
export async function cancelBookingWithRefund(bookingId: string, refundAmount: number, reason: string) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, internal_notes")
    .eq("id", bookingId)
    .single();
  if (error || !booking) throw new Error("Booking bulunamadı");

  const amount = Math.max(0, Math.round(Number(refundAmount) * 100) / 100);

  if (amount > 0) {
    const { data: iyzicoPayment } = await supabase
      .from("booking_payments")
      .select("id, amount, provider_transaction_id")
      .eq("booking_id", bookingId)
      .eq("direction", "inbound")
      .eq("status", "completed")
      .in("type", ["deposit", "full"])
      .not("provider_transaction_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (iyzicoPayment?.provider_transaction_id && amount <= Number(iyzicoPayment.amount) + 0.01) {
      const { refundPayment } = await import("@/lib/iyzico");
      let refundOk = false;
      let refundMsg = "";
      try {
        const result = await refundPayment({
          paymentTransactionId: iyzicoPayment.provider_transaction_id,
          price: amount,
          ip: "85.34.78.112",
        });
        refundOk = result.success;
        refundMsg = result.message ?? "";
      } catch (err) {
        refundMsg = err instanceof Error ? err.message : String(err);
      }
      await supabase.from("booking_payments").insert({
        booking_id: bookingId,
        type: "refund",
        amount,
        direction: "outbound",
        status: refundOk ? "completed" : "failed",
        description: refundOk
          ? "iyzico üzerinden otomatik iade"
          : `iyzico iade başarısız — manuel kontrol gerekiyor${refundMsg ? `: ${refundMsg}` : ""}`,
        paid_at: refundOk ? new Date().toISOString() : null,
      });
    } else {
      // Banka havalesi ile tahsil edilmiş veya iyzico işlem kaydı yok — manuel iade
      await supabase.from("booking_payments").insert({
        booking_id: bookingId,
        type: "refund",
        amount,
        direction: "outbound",
        status: "pending",
        description: "Banka havalesi ile manuel iade gerekiyor",
      });
    }
  }

  const notes = [
    booking.internal_notes,
    `İptal (${new Date().toLocaleDateString("tr-TR")}): ${reason?.trim() || "sebep belirtilmedi"}${amount > 0 ? ` — iade tutarı ${amount.toLocaleString("tr-TR")} ₺` : " — iade yok"}`,
  ].filter(Boolean).join("\n");

  const { error: cancelError } = await supabase
    .from("bookings")
    .update({ status: "cancelled", internal_notes: notes })
    .eq("id", bookingId);
  if (cancelError) throw new Error(cancelError.message);

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/finans");
}
