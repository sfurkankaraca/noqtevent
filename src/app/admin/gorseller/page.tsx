import { createServiceClient } from "@/lib/supabase";
import UploadForm from "./UploadForm";
import AssetGrid from "./AssetGrid";

const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero / Ana Görsel",
  events: "Etkinlik Görselleri",
  artists: "Sanatçı Fotoğrafları",
  brands: "Marka / Ortak Logoları",
  journal: "Journal / Blog",
  other: "Diğer",
};

export default async function GorsellerPage() {
  const supabase = createServiceClient();
  const { data: assets, error } = await supabase
    .from("site_assets")
    .select("*")
    .order("created_at", { ascending: false });

  // Group by category
  const grouped: Record<string, typeof assets> = {};
  for (const asset of assets ?? []) {
    if (!grouped[asset.category]) grouped[asset.category] = [];
    grouped[asset.category]!.push(asset);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Görseller</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Site genelinde kullanılan görselleri yönet
        </p>
      </div>

      <UploadForm />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error.message}
        </div>
      )}

      {!assets?.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">🖼</p>
          <p className="text-foreground font-medium">Henüz görsel yüklenmedi</p>
          <p className="text-sm text-muted-foreground mt-1">
            Yukarıdaki formu kullanarak ilk görseli yükle
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {items?.length}
            </span>
          </div>
          <AssetGrid assets={items ?? []} />
        </section>
      ))}
    </div>
  );
}
