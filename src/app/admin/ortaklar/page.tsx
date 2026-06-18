import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase";
import DeletePartnerButton from "./DeletePartnerButton";

export default async function OrtaklarPage() {
  const supabase = createServiceClient();
  const { data: partners, error } = await supabase
    .from("partner_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Group by service_category
  const grouped: Record<string, typeof partners> = {};
  for (const p of partners ?? []) {
    const cat = p.service_category ?? "Diğer";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat]!.push(p);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Ortaklar</h1>
          <p className="text-sm text-muted-foreground mt-1">Hizmet ortaklarını yönet</p>
        </div>
        <Link href="/admin/ortaklar/new"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          + Yeni Ortak
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error.message}</div>
      )}

      {!partners?.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">🤝</p>
          <p className="text-foreground font-medium">Henüz ortak eklenmedi</p>
          <Link href="/admin/ortaklar/new"
            className="mt-4 inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
            İlk Ortağı Ekle
          </Link>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">{category}</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{items?.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items?.map((partner) => (
              <div key={partner.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                {/* Portfolio cover or placeholder */}
                <div className="relative h-36 bg-secondary/30">
                  {partner.portfolio_images?.[0] ? (
                    <Image src={partner.portfolio_images[0]} alt={partner.company_name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🤝</div>
                  )}
                  <span className={`absolute top-2.5 right-2.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    partner.is_active ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"
                  }`}>
                    {partner.is_active ? "Aktif" : "Pasif"}
                  </span>
                  {/* Logo overlay */}
                  {partner.logo_url && (
                    <div className="absolute bottom-2.5 left-2.5 w-10 h-10 rounded-lg bg-white border border-border overflow-hidden">
                      <Image src={partner.logo_url} alt="Logo" fill className="object-contain p-1" unoptimized />
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-sm">{partner.company_name}</h3>

                  {partner.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{partner.description}</p>
                  )}

                  {partner.services?.length > 0 && (
                    <div className="space-y-1">
                      {partner.services.slice(0, 3).map((s: { name: string; price_range: string }, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-foreground">{s.name}</span>
                          {s.price_range && <span className="text-muted-foreground">{s.price_range}</span>}
                        </div>
                      ))}
                      {partner.services.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{partner.services.length - 3} hizmet daha</p>
                      )}
                    </div>
                  )}

                  {(partner.contact_email || partner.contact_phone) && (
                    <p className="text-xs text-muted-foreground">
                      {partner.contact_email ?? partner.contact_phone}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Link href={`/admin/ortaklar/${partner.id}/edit`}
                      className="flex-1 text-center py-2 rounded-xl text-xs font-medium border border-border hover:bg-secondary transition-colors">
                      Düzenle
                    </Link>
                    <DeletePartnerButton id={partner.id} name={partner.company_name} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
