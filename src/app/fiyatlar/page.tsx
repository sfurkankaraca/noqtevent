import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import PricingClient, { type BudgetTier, type PricingFactor, type FaqItem } from "@/components/sections/PricingClient";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Fiyat Rehberi — Kayseri Düğün DJ & Etkinlik 2025 | NOQT",
  description:
    "Kayseri ve Nevşehir'de düğün DJ, kına gecesi, after party ve kurumsal etkinlik fiyat rehberi. Bütçenizi doğru planlamanız için şeffaf bilgi.",
  alternates: { canonical: "https://www.noqt.events/fiyatlar" },
  keywords: [
    "kayseri düğün dj fiyatı",
    "kayseri dj fiyatı 2025",
    "nevşehir düğün organizasyon fiyatı",
    "düğün dj fiyatı",
    "kına gecesi dj fiyatı",
    "kapadokya düğün fiyatı",
    "kayseri after party dj fiyatı",
  ],
};

const FALLBACK_TIERS: BudgetTier[] = [
  {
    id: "1", label: "Başlangıç", emoji: "🎵", range_text: "₺3.000 – ₺8.000",
    description: "Kişisel DJ seti, taşınabilir ses sistemi. Küçük mekanlara ve özel partilere uygun.",
    includes: ["DJ (3-4 saat)", "Taşınabilir ses sistemi", "Şarkı listesi planlaması"],
    suitable: ["Doğum günü", "Küçük özel parti", "Küçük nişan"],
    is_featured: false, is_dark: false, color: "bg-[oklch(0.94_0.012_200)]",
  },
  {
    id: "2", label: "Standart", emoji: "🎧", range_text: "₺8.000 – ₺18.000",
    description: "Profesyonel DJ, tam kapsamlı ses sistemi, ışık donanımı. Orta ölçekli düğün ve etkinlikler.",
    includes: ["Profesyonel DJ (4-5 saat)", "Tam ses sistemi & subwoofer", "Işık donanımı", "Teknik operatör"],
    suitable: ["Nişan", "Düğün (orta salon)", "Kına gecesi", "Yıldönümü"],
    is_featured: true, is_dark: false, color: "bg-[oklch(0.975_0.006_80)]",
  },
  {
    id: "3", label: "Premium", emoji: "✨", range_text: "₺18.000 – ₺40.000+",
    description: "Deneyimli DJ + canlı müzisyen, premium ses & ışık, etkinlik koordinatörü dahil.",
    includes: ["Headliner DJ (5+ saat)", "Canlı müzisyen (klarnet, keman vb.)", "Premium ses & ışık sistemi", "Etkinlik koordinatörü", "Fotoğrafçı opsiyonu"],
    suitable: ["Büyük düğün", "Festival & kulüp gecesi", "Kurumsal etkinlik", "VIP parti"],
    is_featured: false, is_dark: true, color: "bg-[oklch(0.13_0.01_260)]",
  },
];

const FALLBACK_FACTORS: PricingFactor[] = [
  { id: "1", factor: "Mekan büyüklüğü", impact: "Büyük salon → daha güçlü ses sistemi gereksinimi" },
  { id: "2", factor: "Etkinlik süresi", impact: "Her ekstra saat ücrete eklenir" },
  { id: "3", factor: "Sanatçı deneyimi", impact: "Resident vs. headliner DJ arasında fark var" },
  { id: "4", factor: "Tarih", impact: "Yaz ve yılbaşı dönemi yoğun talep → erken rezervasyon şart" },
  { id: "5", factor: "Canlı müzisyen", impact: "DJ + klarnet/keman kombinasyonu premium ekler" },
  { id: "6", factor: "Teknik rider", impact: "Kendi ekipmanını getiren DJ mi, kiralık mı?" },
];

const FALLBACK_FAQ: FaqItem[] = [
  { id: "1", question: "Fiyata KDV dahil mi?", answer: "Bireysel etkinliklerde genellikle KDV'siz fiyat verilir. Kurumsal etkinliklerde fatura ve KDV ayrıca belirtilir." },
  { id: "2", question: "Depozito alıyor musunuz?", answer: "Evet, rezervasyon onayı için toplam ücretin %30–50'si kapora olarak alınır. Kalan tutar etkinlik günü veya öncesinde ödenir." },
  { id: "3", question: "İptal veya tarih değişikliği mümkün mü?", answer: "30 gün öncesine kadar iade veya tarih değişikliği yapılabilir. Sözleşmede detaylı koşullar belirtilir." },
  { id: "4", question: "Ses sistemi fiyata dahil mi?", answer: "Standart ve premium paketlerde ses sistemi dahildir. Başlangıç paketinde mekan ses sistemini kullanabilirsiniz ya da ekleme ücretli yapılır." },
  { id: "5", question: "Kayseri dışına hizmet veriyor musunuz?", answer: "Evet. Nevşehir, Kapadokya ve çevre illere hizmet veriyoruz. Ulaşım mesafesine göre yol ücreti eklenir." },
];

async function fetchPricingData() {
  try {
    const supabase = createServiceClient();
    const [tiersRes, factorsRes, faqRes] = await Promise.all([
      supabase.from("pricing_tiers").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("pricing_factors").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("pricing_faq").select("*").eq("is_active", true).order("sort_order"),
    ]);

    return {
      tiers: tiersRes.data?.length ? (tiersRes.data as BudgetTier[]) : FALLBACK_TIERS,
      factors: factorsRes.data?.length ? (factorsRes.data as PricingFactor[]) : FALLBACK_FACTORS,
      faq: faqRes.data?.length ? (faqRes.data as FaqItem[]) : FALLBACK_FAQ,
    };
  } catch {
    return { tiers: FALLBACK_TIERS, factors: FALLBACK_FACTORS, faq: FALLBACK_FAQ };
  }
}

export default async function FiyatlarPage() {
  const { tiers, factors, faq } = await fetchPricingData();

  return (
    <>
      <Navigation />
      <main>
        <PricingClient tiers={tiers} factors={factors} faq={faq} />
      </main>
      <Footer />
    </>
  );
}
