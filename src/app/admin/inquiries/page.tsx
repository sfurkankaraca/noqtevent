import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};
const STATUS_LABELS: Record<string, string> = {
  new: "Yeni", contacted: "İletişime Geçildi", confirmed: "Onaylandı", cancelled: "İptal",
};

export default async function InquiriesPage() {
  const supabase = createServiceClient();
  const { data: inquiries, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const EVENT_LABELS: Record<string, string> = {
    wedding: "Düğün",
    "kina-gecesi": "Kına Gecesi",
    corporate: "Kurumsal",
    opening: "Açılış",
    "brand-launch": "Marka Lansmanı",
    "private-party": "Özel Parti",
    cocktail: "Kokteyl",
    sunset: "Sunset Session",
    "after-party": "After Party",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Talepler</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Experience Builder'dan gelen talepler
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error.message}
        </div>
      )}

      {!inquiries?.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-foreground font-medium">Henüz talep yok</p>
        </div>
      )}

      {inquiries && inquiries.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">İSİM</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">ETKİNLİK</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">TARİH</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">İLETİŞİM</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">GELİŞ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">DURUM</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-secondary/20 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/inquiries/${inq.id}`} className="block">
                      <p className="font-medium text-foreground">
                        {inq.contact?.name} {inq.contact?.surname}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs">
                    {EVENT_LABELS[inq.event_type] ?? inq.event_type}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs">
                    {inq.event_date ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-foreground">{inq.contact?.email}</p>
                    <p className="text-xs text-muted-foreground">{inq.contact?.phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {new Date(inq.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3.5">
                    {(() => {
                      const s = inq.status ?? "new";
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[s] ?? STATUS_STYLES.new}`}>
                          {STATUS_LABELS[s] ?? s}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/inquiries/${inq.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Detay →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
