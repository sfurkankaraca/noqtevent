import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  planning:  { label: "Planlanıyor", cls: "bg-blue-50 text-blue-700" },
  active:    { label: "Aktif",       cls: "bg-amber-50 text-amber-700" },
  completed: { label: "Tamamlandı",  cls: "bg-green-50 text-green-700" },
};

export default async function EventProjectsPage() {
  const supabase = createServiceClient();
  const { data: projects } = await supabase
    .from("event_projects")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: items } = await supabase
    .from("checklist_items")
    .select("event_project_id, is_done, due_date")
    .not("event_project_id", "is", null);

  const today = new Date().toISOString().slice(0, 10);
  const progressByProject = new Map<string, { done: number; total: number; overdue: number }>();
  for (const item of items ?? []) {
    const key = item.event_project_id as string;
    const p = progressByProject.get(key) ?? { done: 0, total: 0, overdue: 0 };
    p.total += 1;
    if (item.is_done) p.done += 1;
    else if (item.due_date && item.due_date < today) p.overdue += 1;
    progressByProject.set(key, p);
  }

  const active = projects?.filter((p) => p.status !== "completed") ?? [];
  const past = projects?.filter((p) => p.status === "completed") ?? [];

  const renderRow = (p: NonNullable<typeof projects>[number]) => {
    const meta = STATUS_META[p.status] ?? STATUS_META.planning;
    const progress = progressByProject.get(p.id);
    return (
      <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
        <td className="px-5 py-4">
          <p className="font-medium text-foreground">{p.client_name}</p>
          {p.client_email && <p className="text-xs text-muted-foreground">{p.client_email}</p>}
        </td>
        <td className="px-4 py-4 text-muted-foreground">{p.event_type ?? "—"}</td>
        <td className="px-4 py-4 text-muted-foreground tabular-nums">
          {p.event_date ? new Date(p.event_date).toLocaleDateString("tr-TR") : "—"}
        </td>
        <td className="px-4 py-4 text-muted-foreground">{p.venue_name ?? "—"}</td>
        <td className="px-4 py-4">
          <span className="tabular-nums text-foreground">{progress ? `${progress.done} / ${progress.total}` : "—"}</span>
          {progress && p.status !== "completed" && (
            progress.overdue > 0 ? (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">⚠ {progress.overdue} gecikmiş</span>
            ) : (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">✓ yolunda</span>
            )
          )}
        </td>
        <td className="px-4 py-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${meta.cls}`}>{meta.label}</span>
        </td>
        <td className="px-4 py-4">
          <Link href={`/admin/etkinlikler/${p.id}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Detay →
          </Link>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Etkinlikler</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects?.length ?? 0} kayıt</p>
        </div>
        <Link href="/admin/etkinlikler/yeni"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          + Etkinlik Oluştur
        </Link>
      </div>

      {(!projects || projects.length === 0) && (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <p className="text-4xl mb-4">🗂</p>
          <p className="text-foreground font-medium">Henüz etkinlik yok</p>
          <p className="text-sm text-muted-foreground mt-1">Sihirbazla ilk etkinlik planını oluşturmak için butona tıkla</p>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">Aktif</p>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {["Müşteri", "Tür", "Tarih", "Mekan", "Checklist", "Durum", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">{active.map(renderRow)}</tbody>
            </table>
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">Geçmiş</p>
          <div className="bg-white rounded-2xl border border-border overflow-hidden opacity-70">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">{past.map(renderRow)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
