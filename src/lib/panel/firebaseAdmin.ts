import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
