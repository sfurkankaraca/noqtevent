import { createServiceClient } from "@/lib/supabase";
import { generateOfferPdf } from "@/lib/generateOfferPdf";
import { artistProfileUrl, fetchBookingItems } from "@/lib/bookingItems";
import { calcCashPrice, calcPrepayPrice, isPrepayAvailable } from "@/lib/bookingTerms";
import { calcDiscount, resolveOfferMusicConceptsWithLinks } from "@/lib/offerMusicConcepts";

// Teklif sayfasındaki müşteri (veya admin) için teklif PDF'i üretir.
// offer_slug ile arar — public route'tan çağrılır, booking id'sine güvenilmez.
export async function generateOfferPdfBySlug(offerSlug: string): Promise<Buffer | null> {
  const supabase = createServiceClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, dj_profiles(id, name, performer_type)")
    .eq("offer_slug", offerSlug)
    .single();
  if (error || !booking) return null;

  const items = await fetchBookingItems(supabase, booking.id);

  // Kalem yoksa tek sanatçılı klasik teklif — sanatçıyı tek kalem olarak göster
  const pdfItems = items.length > 0
    ? items.map((it) => ({
        title: it.title,
        artistName: it.dj_profiles?.name ?? null,
        performerType: it.dj_profiles?.performer_type ?? null,
        profileUrl: it.kind === "artist" && it.artist_id ? artistProfileUrl(it.artist_id) : null,
        description: it.description,
        amount: Number(it.amount),
      }))
    : [{
        title: booking.dj_profiles?.name ?? "Sanatçı Performansı",
        artistName: booking.dj_profiles?.name ?? null,
        performerType: booking.dj_profiles?.performer_type ?? null,
        profileUrl: booking.artist_id ? artistProfileUrl(booking.artist_id) : null,
        description: null,
        amount: Number(booking.fee ?? 0),
      }];

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  const fee = Number(booking.fee ?? 0);
  const discount = calcDiscount(booking.list_price, fee);
  const musicConcepts = await resolveOfferMusicConceptsWithLinks(supabase, booking.offer_music_concept_ids);

  return generateOfferPdf({
    bookingId: booking.id,
    offerDate: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    validUntil: booking.offer_expires_at
      ? new Date(booking.offer_expires_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
      : null,
    client: {
      name: booking.client_name,
      email: booking.client_email,
      phone: booking.client_phone,
    },
    event: {
      type: booking.event_type,
      date: booking.event_date,
      time: booking.event_time,
      duration: booking.event_duration_hours,
      venueName: booking.venue_name,
      venueCity: booking.venue_city,
    },
    items: pdfItems,
    cashPrice: calcCashPrice(fee),
    discount: discount ? { ...discount, note: booking.discount_note ?? null } : null,
    musicConcepts: musicConcepts.map((c) => ({
      name: `${c.emoji} ${c.name}`,
      categoryLabel: c.categoryLabel,
      description: c.description,
      musicalDirection: c.musicalDirection.join(", "),
      url: c.url ? `${BASE}${c.url}` : null,
    })),
    prepayPrice: calcPrepayPrice(fee, booking.prepay_markup_rate),
    prepayAvailable: isPrepayAvailable(booking.event_date),
    depositRate: Number(booking.deposit_rate ?? 30),
    offerUrl: `${BASE}/teklif/${offerSlug}`,
    notes: booking.notes,
  });
}
