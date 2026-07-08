import { createServiceClient } from "@/lib/supabase";
import EventWizard from "./EventWizard";

export default async function NewEventProjectPage() {
  const supabase = createServiceClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, client_name, event_date")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Etkinlik Oluştur</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adım adım tüm organizasyon kararlarını verin — sonunda checklist ve proje dosyası otomatik oluşur.
        </p>
      </div>
      <EventWizard bookings={bookings ?? []} />
    </div>
  );
}
