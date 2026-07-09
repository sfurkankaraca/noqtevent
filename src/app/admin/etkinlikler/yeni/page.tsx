import { createServiceClient } from "@/lib/supabase";
import EventWizard from "./EventWizard";

export default async function NewEventProjectPage() {
  const supabase = createServiceClient();
  const [{ data: bookings }, { data: concepts }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, client_name, event_date")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("concepts")
      .select("slug, name, emoji, category, description, atmosphere, musical_direction, energy_level, is_signature")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Etkinlik Oluştur</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Temel bilgiler → konsept → hizmetler → onay. Sonunda checklist, gün planı ve proje dosyası hazır.
        </p>
      </div>
      <EventWizard bookings={bookings ?? []} concepts={concepts ?? []} />
    </div>
  );
}
