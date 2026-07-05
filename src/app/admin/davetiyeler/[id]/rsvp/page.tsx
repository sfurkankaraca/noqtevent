import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

export default async function RsvpListPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: inv }, { data: responses }] = await Promise.all([
    supabase.from("invitations").select("bride_name, groom_name, slug").eq("id", id).single(),
    supabase.from("rsvp_responses").select("*").eq("invitation_id", id).order("created_at", { ascending: false }),
  ]);

  if (!inv) notFound();

  const attending = responses?.filter((r) => r.attending) ?? [];
  const notAttending = responses?.filter((r) => !r.attending) ?? [];
  const totalGuests = attending.reduce((s, r) => s + (r.guest_count ?? 1), 0);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/admin/davetiyeler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Davetiyeler
        </Link>
        <div className="flex items-center justify-between mt-4">
          <h1 className="text-2xl font-medium text-foreground">
            RSVP — {inv.bride_name} &amp; {inv.groom_name}
          </h1>
          <Link href={`/admin/davetiyeler/${id}/edit`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Düzenle →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Katılacak", value: attending.length, color: "text-green-600" },
          { label: "Katılmayacak", value: notAttending.length, color: "text-red-500" },
          { label: "Toplam Misafir", value: totalGuests, color: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-2xl p-5 text-center">
            <p className={`text-3xl font-light ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {responses?.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">Henüz yanıt gelmedi.</p>
        )}
        {responses?.map((r) => (
          <div key={r.id} className="bg-white border border-border rounded-xl p-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-medium text-foreground text-sm">{r.guest_name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.attending ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                  {r.attending ? `Geliyor · ${r.guest_count} kişi` : "Gelmiyor"}
                </span>
              </div>
              {Array.isArray(r.companion_names) && r.companion_names.length > 0 && (
                <p className="text-muted-foreground text-xs mt-1">
                  Beraberinde: {r.companion_names.join(", ")}
                </p>
              )}
              {r.message && <p className="text-muted-foreground text-xs mt-1">&ldquo;{r.message}&rdquo;</p>}
            </div>
            <p className="text-muted-foreground text-xs flex-shrink-0">
              {new Date(r.created_at).toLocaleDateString("tr-TR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
