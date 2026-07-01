import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import BookingForm from "../BookingForm";

export default async function NewBookingPage() {
  const supabase = createServiceClient();
  const [{ data: artists }, { data: inquiries }] = await Promise.all([
    supabase.from("dj_profiles").select("id, name, performer_type").eq("is_active", true).order("name"),
    supabase.from("inquiries").select("id, name, event_type, event_date, email, phone")
      .eq("status", "new").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Bookings
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">Yeni Booking</h1>
      </div>
      <BookingForm artists={artists ?? []} inquiries={inquiries ?? []} />
    </div>
  );
}
