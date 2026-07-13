import { createServiceClient } from "@/lib/supabase";
import { generateContractPdf, type ContractData } from "@/lib/generateContractPdf";

export type ContractResult = {
  pdfBuffer: Buffer;
  contractUrl: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking: Record<string, any>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildContractData(booking: Record<string, any>, agreement: Record<string, any> | null): ContractData {
  return {
    bookingId: booking.id,
    contractDate: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    client: {
      name: booking.client_name,
      email: booking.client_email,
      phone: booking.client_phone,
    },
    artist: {
      name: booking.dj_profiles?.name ?? "—",
      performer_type: booking.dj_profiles?.performer_type,
      city: booking.dj_profiles?.city,
    },
    event: {
      type: booking.event_type,
      date: booking.event_date,
      time: booking.event_time,
      duration: booking.event_duration_hours,
      venueName: booking.venue_name,
      venueCity: booking.venue_city,
      venueAddress: booking.venue_address,
    },
    financial: {
      fee: booking.fee,
      commissionRate: booking.commission_rate,
      depositRate: booking.deposit_rate,
      advanceAmount: booking.advance_amount,
      travelRequired: booking.travel_required,
      accommodationRequired: booking.accommodation_required,
    },
    notes: booking.notes,
    agreement: agreement
      ? {
          acceptedName: agreement.accepted_name,
          acceptedEmail: agreement.accepted_email,
          plan: agreement.payment_plan,
          agreedPrice: Number(agreement.agreed_price),
          acceptedAt: agreement.created_at,
          termsVersion: agreement.terms_version,
          ip: agreement.ip_address,
          verifiedEmail: agreement.verified_email ?? null,
        }
      : null,
  };
}

// Teklif sayfasında (onaydan önce/sonra) müşterinin görüntüleyip indirebileceği
// sözleşme PDF'ini üretir — depolamaya yazmaz, sadece buffer döner.
// offer_slug ile arar (public sayfadan çağrılır, booking id'sine güvenilmez).
export async function generateContractPreview(offerSlug: string): Promise<Buffer | null> {
  const supabase = createServiceClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name, performer_type, city, email)")
    .eq("offer_slug", offerSlug)
    .single();
  if (error || !booking) return null;

  const { data: agreement } = await supabase
    .from("booking_agreements")
    .select("*")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return generateContractPdf(buildContractData(booking, agreement));
}

// Booking'ten (varsa son dijital onayla birlikte) sözleşme PDF'i üretir,
// private "contracts" bucket'ına yükler, 1 yıllık imzalı URL'i booking'e yazar.
export async function createAndStoreContract(bookingId: string): Promise<ContractResult | null> {
  const supabase = createServiceClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name, performer_type, city, email)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) return null;

  const { data: agreement } = await supabase
    .from("booking_agreements")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pdfBuffer = await generateContractPdf(buildContractData(booking, agreement));

  // Sözleşmeler PII içerdiği için private bucket'ta tutulur; erişim imzalı URL ile
  const bucket = "contracts";
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === bucket)) {
    await supabase.storage.createBucket(bucket, { public: false });
  }

  const fileName = `${booking.id}/sozlesme-${Date.now()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });

  let contractUrl: string | null = null;
  if (!uploadError) {
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 yıl
    if (!signError && signed) {
      contractUrl = signed.signedUrl;
      await supabase.from("bookings").update({ contract_url: contractUrl }).eq("id", booking.id);
    } else {
      console.error("Contract sign-url error:", signError?.message);
    }
  } else {
    console.error("Contract upload error:", uploadError.message);
  }

  return { pdfBuffer, contractUrl, booking };
}
