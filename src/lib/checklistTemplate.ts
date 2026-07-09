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

// Sihirbazda adım adım sorulan kategoriler ("diger" hariç — o serbest ekleme için)
export const WIZARD_CATEGORIES: ChecklistCategory[] = CATEGORY_ORDER.filter((c) => c !== "diger");

export type CategoryDecision = {
  included: boolean;
  assignee?: string;
  vendor?: string;
  note?: string;
};

// dueOffsetDays: etkinlik tarihinden kaç gün önce tamamlanmalı (son tarih = etkinlik tarihi − offset)
export const DEFAULT_CHECKLIST_TEMPLATE: { category: ChecklistCategory; title: string; dueOffsetDays: number }[] = [
  { category: "mekan", title: "Mekan seçimi ve rezervasyonu", dueOffsetDays: 90 },
  { category: "mekan", title: "Etkinlik tarihi ve saati netleştirildi", dueOffsetDays: 90 },
  { category: "mekan", title: "Mekan kapasitesi misafir sayısına uygun", dueOffsetDays: 85 },
  { category: "sozlesme", title: "Sözleşme imzalandı", dueOffsetDays: 75 },
  { category: "sozlesme", title: "Kapora ödendi", dueOffsetDays: 70 },
  { category: "sozlesme", title: "Kalan ödeme planı netleşti", dueOffsetDays: 60 },
  { category: "catering", title: "Catering firması belirlendi", dueOffsetDays: 60 },
  { category: "catering", title: "Menü tadım günü yapıldı", dueOffsetDays: 30 },
  { category: "catering", title: "Özel diyet/alerji talepleri alındı", dueOffsetDays: 14 },
  { category: "dekor", title: "Dekor konsepti belirlendi", dueOffsetDays: 50 },
  { category: "dekor", title: "Çiçek/aranjman siparişi verildi", dueOffsetDays: 21 },
  { category: "dekor", title: "Masa düzeni planlandı", dueOffsetDays: 14 },
  { category: "muzik", title: "DJ/sanatçı rezervasyonu yapıldı", dueOffsetDays: 60 },
  { category: "muzik", title: "Müzik listesi ve özel istekler paylaşıldı", dueOffsetDays: 21 },
  { category: "muzik", title: "Ses/ışık teknik gereksinimleri (rider) mekana iletildi", dueOffsetDays: 14 },
  { category: "fotograf", title: "Fotoğrafçı/videografer rezervasyonu yapıldı", dueOffsetDays: 60 },
  { category: "fotograf", title: "Çekim programı (timeline) paylaşıldı", dueOffsetDays: 7 },
  { category: "davetiye", title: "Davetiyeler gönderildi", dueOffsetDays: 45 },
  { category: "davetiye", title: "Misafir listesi ve RSVP takibi tamamlandı", dueOffsetDays: 14 },
  { category: "davetiye", title: "Oturma planı hazırlandı", dueOffsetDays: 10 },
  { category: "gun_plani", title: "Gün akışı (saat saat program) hazırlandı", dueOffsetDays: 7 },
  { category: "gun_plani", title: "Sorumlu kişi/koordinatör atandı", dueOffsetDays: 7 },
  { category: "ulasim", title: "Misafir ulaşımı planlandı", dueOffsetDays: 14 },
  { category: "ulasim", title: "Konaklama gereken misafirler için rezervasyon yapıldı", dueOffsetDays: 21 },
  { category: "son_kontrol", title: "Tüm tedarikçilerle bir gün önce teyit yapıldı", dueOffsetDays: 1 },
  { category: "son_kontrol", title: "Hava durumu kontrol edildi (açık hava etkinlikleri için)", dueOffsetDays: 2 },
  { category: "son_kontrol", title: "Acil durum/yedek plan hazır", dueOffsetDays: 3 },
];

// Etkinlik günü akışı şablonu — "Şablondan Gün Planı Oluştur" ile eklenir, sonra düzenlenir
export const DEFAULT_RUN_SHEET: { time: string; title: string }[] = [
  { time: "12:00", title: "Kurulum başlangıcı — dekor, masa düzeni" },
  { time: "14:00", title: "Ses/ışık kurulumu ve prova" },
  { time: "16:00", title: "Ekip toplantısı — gün akışı üzerinden geçilir" },
  { time: "17:00", title: "Son kontrol — mekan, catering, teknik hazır" },
  { time: "18:00", title: "Misafir kabulü başlar" },
  { time: "19:00", title: "Açılış / karşılama" },
  { time: "19:30", title: "Yemek servisi" },
  { time: "21:00", title: "İlk dans / konuşmalar" },
  { time: "21:30", title: "Pasta kesimi" },
  { time: "22:00", title: "Dans bloğu / eğlence" },
  { time: "00:30", title: "Kapanış" },
  { time: "01:00", title: "Toplama ve teslim" },
];
