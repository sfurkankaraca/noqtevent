// JSON-LD gömme yardımcısı — Bulgu 9 (güvenlik taraması 2026-09-04).
//
// <script type="application/ld+json"> içine doğrudan JSON.stringify sonucu basıldığında,
// veritabanından gelen bir metin "</script>" içeriyorsa script bloğu erkenden kapanır ve
// depolanmış XSS'e dönüşür. "<" karakterini \u003c olarak kaçırmak bunu kapatır
// (JSON ayrıştırıcısı geri çözer, HTML ayrıştırıcısı script kapanışı görmez).
// U+2028/U+2029 satır ayırıcıları da JS içinde kırılmaya yol açtığı için kaçırılır.
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
