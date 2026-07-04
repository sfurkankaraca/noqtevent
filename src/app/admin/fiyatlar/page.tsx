import { getTiers, getFactors, getFaq } from "./actions";
import PricingEditor from "./PricingEditor";

export default async function AdminFiyatlarPage() {
  let tiers: Awaited<ReturnType<typeof getTiers>> = [];
  let factors: Awaited<ReturnType<typeof getFactors>> = [];
  let faq: Awaited<ReturnType<typeof getFaq>> = [];
  try {
    [tiers, factors, faq] = await Promise.all([getTiers(), getFactors(), getFaq()]);
  } catch {
    // tables may not exist yet
  }

  const noData = tiers.length === 0 && factors.length === 0 && faq.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Fiyatlar Sayfası</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bütçe seviyeleri, fiyatı etkileyen faktörler ve SSS bölümlerini düzenleyin.
        </p>
        {noData && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Veri bulunamadı. <strong>supabase-migration-pricing.sql</strong> dosyasını Supabase Dashboard &gt; SQL Editor&apos;da çalıştırarak tabloları oluşturun.
          </div>
        )}
      </div>

      <PricingEditor tiers={tiers} factors={factors} faq={faq} />
    </div>
  );
}
