import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { fetchBookingItems } from "@/lib/bookingItems";
import { fetchOfferPackages } from "@/lib/offerPackages";
import BookingDetail from "./BookingDetail";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: booking }, { data: payments }, { data: artists }, items, packages] = await Promise.all([
    supabase.from("bookings").select("*, dj_profiles(id, name, performer_type, slug, photo_url)").eq("id", id).single(),
    supabase.from("booking_payments").select("*").eq("booking_id", id).order("created_at"),
    supabase.from("dj_profiles").select("id, name, performer_type").eq("is_active", true).order("name"),
    fetchBookingItems(supabase, id),
    fetchOfferPackages(supabase, id),
  ]);

  if (!booking) notFound();

  // Müşteri teklif sayfasından konsept seçtiyse adını çöz (tablo yoksa sessizce geç)
  let selectedConceptName: string | null = null;
  if (booking.offer_selected_concept_id) {
    const { data: concept } = await supabase
      .from("offer_concepts")
      .select("name")
      .eq("id", booking.offer_selected_concept_id)
      .single();
    selectedConceptName = concept?.name ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Bookings
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">{booking.client_name}</h1>
      </div>
      <BookingDetail
        booking={booking}
        payments={payments ?? []}
        artists={artists ?? []}
        items={items}
        packages={packages}
        selectedConceptName={selectedConceptName}
      />
    </div>
  );
}
