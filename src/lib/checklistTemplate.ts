export type ChecklistCategory =
  | "mekan" | "sozlesme" | "catering" | "dekor" | "muzik"
  | "fotograf" | "davetiye" | "gun_plani" | "ulasim" | "son_kontrol" | "diger";

export const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  mekan: "Mekan & Tarih",
  sozlesme: "Sözleşme & Ödeme",
  catering: "Catering",
  dekor: "Dekor & Çiçek",
  muzik: "Müzik & Sanatçı",
  fotograf: "Fotoğraf & Video",
  davetiye: "Davetiye & Misafir",
  gun_plani: "Gün Planı & Zaman Çizelgesi",
  ulasim: "Ulaşım & Konaklama",
  son_kontrol: "Son Kontrol",
  diger: "Diğer",
};

export const CATEGORY_ORDER: ChecklistCategory[] = [
  "mekan", "sozlesme", "catering", "dekor", "muzik",
  "fotograf", "davetiye", "gun_plani", "ulasim", "son_kontrol", "diger",
];

export const DEFAULT_CHECKLIST_TEMPLATE: { category: ChecklistCategory; title: string }[] = [
  { category: "mekan", title: "Mekan seçimi ve rezervasyonu" },
  { category: "mekan", title: "Etkinlik tarihi ve saati netleştirildi" },
  { category: "mekan", title: "Mekan kapasitesi misafir sayısına uygun" },
  { category: "sozlesme", title: "Sözleşme imzalandı" },
  { category: "sozlesme", title: "Kapora ödendi" },
  { category: "sozlesme", title: "Kalan ödeme planı netleşti" },
  { category: "catering", title: "Catering firması belirlendi" },
  { category: "catering", title: "Menü tadım günü yapıldı" },
  { category: "catering", title: "Özel diyet/alerji talepleri alındı" },
  { category: "dekor", title: "Dekor konsepti belirlendi" },
  { category: "dekor", title: "Çiçek/aranjman siparişi verildi" },
  { category: "dekor", title: "Masa düzeni planlandı" },
  { category: "muzik", title: "DJ/sanatçı rezervasyonu yapıldı" },
  { category: "muzik", title: "Müzik listesi ve özel istekler paylaşıldı" },
  { category: "muzik", title: "Ses/ışık teknik gereksinimleri (rider) mekana iletildi" },
  { category: "fotograf", title: "Fotoğrafçı/videografer rezervasyonu yapıldı" },
  { category: "fotograf", title: "Çekim programı (timeline) paylaşıldı" },
  { category: "davetiye", title: "Davetiyeler gönderildi" },
  { category: "davetiye", title: "Misafir listesi ve RSVP takibi tamamlandı" },
  { category: "davetiye", title: "Oturma planı hazırlandı" },
  { category: "gun_plani", title: "Gün akışı (saat saat program) hazırlandı" },
  { category: "gun_plani", title: "Sorumlu kişi/koordinatör atandı" },
  { category: "ulasim", title: "Misafir ulaşımı planlandı" },
  { category: "ulasim", title: "Konaklama gereken misafirler için rezervasyon yapıldı" },
  { category: "son_kontrol", title: "Tüm tedarikçilerle bir gün önce teyit yapıldı" },
  { category: "son_kontrol", title: "Hava durumu kontrol edildi (açık hava etkinlikleri için)" },
  { category: "son_kontrol", title: "Acil durum/yedek plan hazır" },
];
