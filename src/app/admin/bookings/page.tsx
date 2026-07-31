import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import DeleteBookingButton from "./DeleteBookingButton";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:        { label: "Taslak",            cls: "bg-gray-100 text-gray-600" },
  offer_sent:   { label: "Teklif Gönderildi", cls: "bg-blue-50 text-blue-700" },
  confirmed:    { label: "Onaylandı",         cls: "bg-cyan-50 text-cyan-700" },
  contracted:   { label: "Sözleşme İmzalandı", cls: "bg-violet-50 text-violet-700" },
  deposit_paid: { label: "Kapora Alındı",     cls: "bg-amber-50 text-amber-700" },
  full_paid:    { label: "Tam Ödeme",         cls: "bg-orange-50 text-orange-700" },
  completed:    { label: "Tamamlandı",        cls: "bg-green-50 text-green-700" },
  cancelled:    { label: "İptal",             cls: "bg-red-50 text-red-700" },
};

export default async function BookingsPage() {
  const supabase = createServiceClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name, performer_type)")
    .order("created_at", { ascending: false });

  const active = bookings?.filter((b) => !["completed", "cancelled"].includes(b.status)) ?? [];
  const past = bookings?.filter((b) => ["completed", "cancelled"].includes(b.status)) ?? [];

  const fmt = (n: number) => n.toLocaleString("tr-TR");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">{bookings?.length ?? 0} kayıt</p>
        </div>
        <Link href="/admin/bookings/new"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          + Yeni Booking
        </Link>
      </div>

      {(!bookings || bookings.length === 0) && (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <p className="text-4xl mb-4">🎤</p>
          <p className="text-foreground font-medium">Henüz booking yok</p>
          <p className="text-sm text-muted-foreground mt-1">İlk booking&apos;i oluşturmak için butona tıkla</p>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">Aktif</p>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {["Müşteri", "Sanatçı", "Etkinlik", "Tarih", "Ücret", "Durum", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {active.map((b) => {
                  const meta = STATUS_META[b.status] ?? STATUS_META.draft;
                  return (
                    <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{b.client_name}</p>
                        <p className="text-xs text-muted-foreground">{b.client_email}</p>
                      </td>
                      <td className="px-4 py-4 text-foreground">
                        {(b.dj_profiles as { name: string } | null)?.name ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{b.event_type ?? "—"}</td>
                      <td className="px-4 py-4 text-muted-foreground tabular-nums">
                        {b.event_date ? new Date(b.event_date).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td className="px-4 py-4 tabular-nums font-medium text-foreground">
                        {b.fee ? `${fmt(b.fee)} ₺` : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/bookings/${b.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Detay →
                          </Link>
                          <DeleteBookingButton id={b.id} name={b.client_name} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">Geçmiş</p>
          <div className="bg-white rounded-2xl border border-border overflow-hidden opacity-70">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {past.map((b) => {
                  const meta = STATUS_META[b.status] ?? STATUS_META.draft;
                  return (
                    <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{b.client_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(b.dj_profiles as { name: string } | null)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.event_date ? new Date(b.event_date).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-foreground">
                        {b.fee ? `${fmt(b.fee)} ₺` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/bookings/${b.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Detay →
                          </Link>
                          <DeleteBookingButton id={b.id} name={b.client_name} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
