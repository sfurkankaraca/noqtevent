import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import DeleteConceptButton from "./DeleteConceptButton";

const CATEGORY_LABELS: Record<string, string> = {
  "cocktail": "Kokteyl & Karşılama",
  "celebration": "Modern Kutlama",
  "traditional": "Geleneksel",
  "after-party": "After Party",
};

export default async function KonseptlerPage() {
  const supabase = createServiceClient();
  const { data: concepts, error } = await supabase
    .from("concepts")
    .select("*")
    .order("sort_order")
    .order("category");

  const grouped = (concepts ?? []).reduce<Record<string, typeof concepts>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category]!.push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Konseptler</h1>
          <p className="text-sm text-muted-foreground mt-1">Müzik konseptleri ve atmosfer açıklamaları</p>
        </div>
        <Link
          href="/admin/konseptler/new"
          className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yeni Konsept
        </Link>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          {error.message} — SQL migration çalıştırıldı mı? (supabase-migration-concepts.sql)
        </div>
      )}

      {Object.entries(CATEGORY_LABELS).map(([cat, catLabel]) => {
        const items = grouped[cat] ?? [];
        return (
          <div key={cat} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{catLabel} ({items.length})</h2>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground px-5 py-4">Bu kategoride konsept yok</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {items.map((c) => (
                      <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-3 w-10 text-xl">{c.emoji}</td>
                        <td className="px-2 py-3">
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.slug}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{c.description}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {c.is_signature && (
                            <span className="text-xs px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full mr-2">imza</span>
                          )}
                          <Link href={`/admin/konseptler/${c.id}/edit`} className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-3">
                            Düzenle
                          </Link>
                          <DeleteConceptButton id={c.id} name={c.name} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
