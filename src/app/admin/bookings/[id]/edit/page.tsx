import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { fetchBookingItems } from "@/lib/bookingItems";
import BookingForm from "../../BookingForm";

export default async function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const [{ data: booking }, { data: artists }, items] = await Promise.all([
    supabase.from("bookings").select("*").eq("id", id).single(),
    supabase.from("dj_profiles").select("id, name, performer_type").eq("is_active", true).order("name"),
    fetchBookingItems(supabase, id),
  ]);

  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Bookings
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <Link href={`/admin/bookings/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {booking.client_name}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">Düzenle</h1>
      </div>
      <BookingForm artists={artists ?? []} booking={booking} items={items} />
    </div>
  );
}
