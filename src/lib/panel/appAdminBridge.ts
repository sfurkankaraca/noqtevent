import "server-only";

// Uygulama yönetimi köprüsü (eventmatch Firestore) çağrılarını KIRICI OLMAYAN
// hale getiren ortak sarıcı. firebaseAdmin.ts::loadServiceAccount() env eksik/
// geçersizken bilerek fırlatıyor (bkz. o dosyadaki yorum) — burası o hatayı
// (ve Firestore'un kendi reddettiği durumları) YAKALAYIP sınıflandırdığımız
// tek yer. Admin sayfaları (uygulama/kullanicilar, geribildirim, istatistikler,
// ileride eklenecek her yeni köprü sayfası) veri çekme kod bloğunu bu
// fonksiyonla sarmalı, sonucu <AdminBridgeError> ile göstermeli
// (bkz. src/components/panel/AdminBridgeError.tsx).

export type AdminBridgeErrorKind =
  | "config" // FIREBASE_SERVICE_ACCOUNT eksik/çözümlenemedi — bkz. loadServiceAccount()
  | "access" // Firestore'a ulaşıldı ama istek reddedildi/yerine getirilemedi (izin, eksik index, ...)
  | "unknown"; // beklenmeyen (ör. ağ) hata

export interface AdminBridgeErrorInfo {
  kind: AdminBridgeErrorKind;
  message: string;
}

export type AdminBridgeResult<T> = { ok: true; data: T } | { ok: false; error: AdminBridgeErrorInfo };

// Firestore Admin SDK (google-gax/@google-cloud/firestore) hataları başarısız
// olduğunda .code alanında gRPC durum kodu taşır — bunlar "Firestore'a
// ulaşıldı ama doküman okunamadı" sınıfına (izin reddi, eksik composite
// index, kimlik doğrulama) işaret eder; env/servis hesabı sorunundan AYRI
// ele alınmalı (görev talimatı madde 4).
// bkz. https://github.com/googleapis/nodejs-firestore, grpc/codes.
const FIRESTORE_ACCESS_ERROR_CODES = new Set([
  5, // NOT_FOUND
  7, // PERMISSION_DENIED — Firestore güvenlik kuralı ya da IAM reddi
  9, // FAILED_PRECONDITION — genelde eksik composite index (mesajda oluşturma linki gelir)
  16, // UNAUTHENTICATED — servis hesabı anahtarı geçersiz/iptal edilmiş
]);

function classifyAdminBridgeError(err: unknown): AdminBridgeErrorInfo {
  const message = err instanceof Error ? err.message : String(err);

  // loadServiceAccount() (firebaseAdmin.ts) env eksik/çözümlenemezken bu iki
  // mesajdan birini fırlatır — kurulum adımı eksik demek, "config" sınıfı.
  if (message.includes("FIREBASE_SERVICE_ACCOUNT")) {
    return { kind: "config", message };
  }

  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code === "number" && FIRESTORE_ACCESS_ERROR_CODES.has(code)) {
    return { kind: "access", message };
  }

  return { kind: "unknown", message };
}

// Admin sayfalarının veri çekme bloğunu sarmalayan yardımcı — fn() içindeki
// HERHANGİ bir admin sorgusu (appAdminQueries.ts) fırlatırsa sayfayı Next.js'in
// çıplak hata sayfasına düşürmek yerine sınıflandırılmış bir hata döndürür.
// Not: raw stack trace asla döndürülmez/loglanmaz-dışına-sızmaz — yalnız
// err.message (kurucunun ne eksik olduğunu anlaması için yeterli, hassas
// değil) çağırana geçer; tam hata sunucu konsoluna loglanır.
export async function safeAdminCall<T>(fn: () => Promise<T>): Promise<AdminBridgeResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    console.error("[appAdminBridge] uygulama yönetimi köprüsü çağrısı başarısız:", err);
    return { ok: false, error: classifyAdminBridgeError(err) };
  }
}
