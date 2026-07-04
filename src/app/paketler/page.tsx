import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import PackagesClient, { type PackageItem } from "@/components/sections/PackagesClient";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Etkinlik Paketleri — DJ, Fotoğraf, Dekorasyon | NOQT",
  description:
    "Kayseri ve Nevşehir düğün, nişan ve özel etkinlikleriniz için hazır deneyim paketleri. DJ, fotoğrafçı, dekorasyon — tek sözleşme, tek ekip, tek fiyat.",
  alternates: { canonical: "https://www.noqt.events/paketler" },
  keywords: [
    "kayseri düğün paketi",
    "kayseri düğün organizasyon paketi",
    "nevşehir düğün paketi",
    "dj fotoğrafçı paketi",
    "düğün müzik dekorasyon paketi",
    "kayseri etkinlik paketi",
  ],
};

const FALLBACK_PACKAGES: PackageItem[] = [
  {
    slug: "dugun-deneyimi",
    tag: "En Çok Tercih",
    name: "Düğün Deneyimi",
    emoji: "💍",
    desc: "Hayatınızın en özel gecesini başından sonuna biz yönetiyoruz. DJ, canlı müzisyen, fotoğrafçı ve dekorasyon tek çatı altında.",
    includes: ["Profesyonel DJ (5 saat set)", "Canlı müzisyen / klarnet", "Düğün fotoğrafçısı", "Çiçek & masa dekorasyonu", "Ses sistemi kurulum & operasyon", "Etkinlik koordinatörü", "Sözleşme & ödeme planı"],
    suitable: ["Düğün", "Nişan", "Kına Gecesi"],
    priceFrom: null,
    priceNote: "Kişisel teklif için",
    cta: "Teklif Al",
    href: "/planla",
    color: "bg-[oklch(0.94_0.035_65)]",
    dark: false,
  },
  {
    slug: "kulup-gecesi",
    tag: "Organizatörlere Özel",
    name: "Kulüp & Festival Gecesi",
    emoji: "🎧",
    desc: "Kulüp açılışları, festival sahneleri ve after party'ler için eksiksiz teknik ve sanatsal kadro.",
    includes: ["Ana DJ + açılış DJ", "Profesyonel ses & ışık sistemi", "Teknik rider hazırlığı", "Sahne koordinasyonu", "Sözleşme & ön ödeme sistemi"],
    suitable: ["Kulüp Gecesi", "Festival", "After Party", "Morning Party"],
    priceFrom: null,
    priceNote: "Kadro & tarih bazlı fiyat",
    cta: "Kadroyu Gör",
    href: "/sanatcilar",
    color: "bg-[oklch(0.13_0.01_260)]",
    dark: true,
  },
  {
    slug: "kurumsal-gece",
    tag: "Kurumsal",
    name: "Kurumsal Etkinlik",
    emoji: "🏢",
    desc: "Lansman, yılsonu gecesi, açılış — fatura, sözleşme, teknik koordinasyon ve MC dahil tam kapsamlı paket.",
    includes: ["DJ veya canlı müzisyen", "MC / Sunucu", "Ses & sahne teknik koordinasyonu", "Fatura & kurumsal sözleşme", "Etkinlik timeline planlaması"],
    suitable: ["Lansman", "Yılsonu Gecesi", "Açılış", "Ödül Töreni"],
    priceFrom: null,
    priceNote: "Kişisel teklif için",
    cta: "Teklif Al",
    href: "/planla",
    color: "bg-[oklch(0.93_0.012_200)]",
    dark: false,
  },
  {
    slug: "ozel-parti",
    tag: "Esnek",
    name: "Özel Parti",
    emoji: "🎉",
    desc: "Doğum günü, bride party, sürpriz — küçük ölçekli ama büyük enerji. Bütçenize göre şekillendiriyoruz.",
    includes: ["DJ (3-4 saat set)", "Bluetooth / kablosuz ses sistemi", "Şarkı listesi planlaması", "Dekor önerileri"],
    suitable: ["Doğum Günü", "Bride Party", "Sürpriz Parti", "Mezuniyet"],
    priceFrom: null,
    priceNote: "Mekan & süreye göre",
    cta: "Planlamaya Başla",
    href: "/planla",
    color: "bg-[oklch(0.92_0.022_320)]",
    dark: false,
  },
];

async function fetchPackages(): Promise<PackageItem[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error || !data?.length) return FALLBACK_PACKAGES;
    return data.map((p) => ({
      slug: p.slug,
      tag: p.tag,
      name: p.name,
      emoji: p.emoji,
      desc: p.description,
      includes: Array.isArray(p.includes) ? p.includes : [],
      suitable: Array.isArray(p.suitable) ? p.suitable : [],
      priceFrom: p.price_from ? Number(p.price_from) : null,
      priceNote: p.price_note,
      cta: p.cta_text ?? "Teklif Al",
      href: p.cta_href ?? "/planla",
      color: p.color ?? "bg-background",
      dark: p.is_dark ?? false,
    }));
  } catch {
    return FALLBACK_PACKAGES;
  }
}

export default async function PaketlerPage() {
  const packages = await fetchPackages();

  return (
    <>
      <Navigation />
      <main>
        <PackagesClient packages={packages} />
      </main>
      <Footer />
    </>
  );
}
