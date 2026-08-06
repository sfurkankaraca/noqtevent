import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
// "firebase-admin/auth" BİLEREK statik import edilmiyor — bkz. getAdminAuth().

// Uygulama yönetimi köprüsü (ETKINLIK_KESIF_V1_TASARIM.md §4.3, Dalga 1) —
// eventmatch Firestore projesine (eventmatch-bd8ad) Firebase Admin SDK ile
// bağlanır. YALNIZ server tarafında import edilmeli (server actions, admin
// sayfalarının server component'leri) — service account private key'i
// istemciye asla gönderilmez, "server-only" import'u bunu build-time'da
// zorunlu kılar (istemci bundle'ına sızarsa build patlar).
//
// FIREBASE_SERVICE_ACCOUNT env'i eventmatch Firebase projesinin servis
// hesabı JSON anahtarının base64'e çevrilmiş hali. Env yoksa lazy init
// devreye girmediği için build/genel sayfa render'ı KIRILMAZ — yalnız bu
// modülü kullanan admin route'ları çağrıldığında anlaşılır bir hata fırlatır.
//
// Üretim adımları (RAPOR'da tekrarlanıyor):
// 1. Firebase Console → eventmatch-bd8ad projesi → Project settings →
//    Service accounts → "Generate new private key" → JSON dosyası iner.
// 2. `base64 -i service-account.json | tr -d '\n'` (macOS) ile tek satır
//    base64 üret.
// 3. Vercel → noqteventweb projesi → Settings → Environment Variables →
//    FIREBASE_SERVICE_ACCOUNT = (o base64 string), Production+Preview.
// 4. İndirilen JSON dosyasını SİL / commit'leme — yalnız Vercel env'inde dursun.

let cachedApp: App | null = null;

function loadServiceAccount(): Record<string, unknown> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw || !raw.trim()) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT env değişkeni tanımlı değil — uygulama yönetimi köprüsü " +
        "(kullanıcılar/geri bildirim/istatistikler) çalışamaz. Kurulum adımları için " +
        "src/lib/panel/firebaseAdmin.ts başındaki yorumu oku."
    );
  }
  try {
    const json = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT çözümlenemedi — geçerli bir base64 kodlanmış Firebase " +
        "servis hesabı JSON'u olmalı."
    );
  }
}

// Tekil init: soğuk başlatmada modül birden çağrılabilir, mevcut app varsa
// onu döndürür (getApps() zaten NOQT'nin eventmatch dışı başka Firebase
// app'i yok, bu yüzden isimsiz varsayılan app güvenle kullanılabilir).
function getFirebaseAdminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }
  const serviceAccount = loadServiceAccount();
  cachedApp = initializeApp({ credential: cert(serviceAccount) });
  return cachedApp;
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}

// GEÇİCİ (2026-08-06): "firebase-admin/auth" alt modülü jwks-rsa → jose
// zincirinden geçiyor ve kurulu jose@6.x artık salt ESM (CJS require() ile
// hiç açılamıyor — jwks-rsa'nın kendi kaynağı require('jose') yaptığı için
// bu Node'un kendi çözümlemesinde de kırılır, bundler'a özgü değil). Statik
// `import { getAuth } from "firebase-admin/auth"` modül YÜKLENİRKEN
// çalıştığı için, getAdminAuth() HİÇ ÇAĞRILMASA BİLE onu içeren her dosya
// (appAdminQueries.ts üzerinden kullanicilar/geribildirim/istatistikler)
// ERR_REQUIRE_ESM ile 500 veriyordu. Dinamik import bunu yalnız GERÇEKTEN
// çağrıldığında yükler — bugün tek çağıran eventmatchAdminApi.ts'in
// "Hesabı Sil" köprüsü (mintFounderIdToken), o da BU HATAYA hâlâ açık
// olacak ta ki jose bir CJS-uyumlu sürüme sabitlenene/jwks-rsa güncellenene
// kadar. Kalıcı çözüm: package.json'da jose'yi jwks-rsa'nın CJS
// destekleyen bir sürümüne pinlemek (ayrı bir iş, burada yapılmadı).
export async function getAdminAuth() {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(getFirebaseAdminApp());
}

// eventmatch'in varsayılan Storage bucket'ı — lib/firebase_options.dart'ta
// (istemci app'inin kendi yapılandırması) açıkça yazılı, GİZLİ DEĞİL. Admin
// SDK `storageBucket` initializeApp'e verilmediği için bucket() çağrısında
// adı açıkça geçmek gerekiyor (aksi halde "Bucket name not specified" hatası).
const EVENTMATCH_STORAGE_BUCKET = "eventmatch-bd8ad.firebasestorage.app";

export function getAdminStorageBucket() {
  return getStorage(getFirebaseAdminApp()).bucket(EVENTMATCH_STORAGE_BUCKET);
}
