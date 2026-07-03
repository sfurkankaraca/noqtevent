import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getMyArtistProfile } from "@/lib/artistAuth";
import { createServiceClient } from "@/lib/supabase";
import DjDashboardClient from "./DjDashboardClient";

export const dynamic = "force-dynamic";

export default async function DjDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dj/dashboard");

  const profile = await getMyArtistProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.97_0.005_80)] px-6">
        <div className="max-w-md text-center bg-white rounded-2xl border border-border p-8">
          <p className="text-2xl mb-3">🎧</p>
          <p className="font-semibold text-foreground mb-2">Sanatçı profili bulunamadı</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hesabınızın e-posta adresi onaylı bir NOQT sanatçı profiliyle eşleşmedi.
            Başvurunuz henüz onaylanmamış olabilir veya farklı bir e-posta ile kayıtlı olabilir —
            lütfen bizimle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createServiceClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, client_name, event_type, event_date, venue_name, venue_city, status")
    .eq("artist_id", profile.id)
    .not("status", "eq", "cancelled")
    .order("event_date", { ascending: true });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (bookings ?? []).filter((b) => !b.event_date || b.event_date >= today);
  const past = (bookings ?? []).filter((b) => b.event_date && b.event_date < today);

  return (
    <DjDashboardClient
      profile={profile}
      upcoming={upcoming}
      past={past}
    />
  );
}
