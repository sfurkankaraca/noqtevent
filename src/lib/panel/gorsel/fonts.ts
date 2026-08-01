// Story/post görsel route'ları (src/app/panel/etkinlik/[id]/gorsel,
// src/app/panel/takvim/gorsel) arasında paylaşılan font yükleyici.
//
// next/og'un varsayılan fontları Türkçe karakterleri (ğüşıöçİ) güvenilir
// biçimde kapsamıyor — bu yüzden Google Fonts'tan indirilen, OFL lisanslı
// Inter TTF'leri repoya gömülü (bkz. ./fonts/OFL.txt). Bu dosyalar Google'ın
// "latin" alt kümesi (unicode-range U+0000-00FF + U+0131) DEĞİL — Accept
// header göndermeden alınan geniş kapsamlı varsayılan TTF: ğ ş ı ö ç İ Ğ Ş Ç
// Ö Ü glyph'lerinin hepsini içeriyor (elle fontTools ile doğrulandı, bkz.
// final rapor). `fetch(new URL('./fonts/...', import.meta.url))` deseni
// Next.js'in route handler bundling'i için resmi önerilen yöntem — dosya
// Node/Edge fark etmeksizin build'e gömülür.
export async function loadImageFonts() {
  const [regular, semibold, bold] = await Promise.all([
    fetch(new URL("./fonts/Inter-Regular.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./fonts/Inter-SemiBold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./fonts/Inter-Bold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);
  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}
