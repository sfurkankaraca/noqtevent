import { getPackages } from "./actions";
import PackageForm from "./PackageForm";

export default async function AdminPaketlerPage() {
  let packages: Awaited<ReturnType<typeof getPackages>> = [];
  try {
    packages = await getPackages();
  } catch {
    // table may not exist yet
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Paketler</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Her paketin fiyat, içerik ve görünürlük ayarlarını buradan düzenleyebilirsiniz.
        </p>
        {packages.length === 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Paket bulunamadı. <strong>supabase-migration-packages.sql</strong> dosyasını Supabase Dashboard &gt; SQL Editor&apos;da çalıştırarak tabloyu ve varsayılan paketleri oluşturun.
          </div>
        )}
      </div>

      <div className="space-y-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{pkg.emoji}</span>
              <div>
                <h2 className="font-medium text-foreground">{pkg.name}</h2>
                <p className="text-xs text-muted-foreground">/{pkg.slug}</p>
              </div>
              {!pkg.is_active && (
                <span className="ml-auto text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">Pasif</span>
              )}
            </div>
            <PackageForm pkg={pkg} />
          </div>
        ))}
      </div>
    </div>
  );
}
