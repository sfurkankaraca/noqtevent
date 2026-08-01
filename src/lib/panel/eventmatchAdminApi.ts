import "server-only";
import { getAdminAuth } from "@/lib/panel/firebaseAdmin";

// "Hesabı Sil" köprüsü — eventmatch'in mevcut `adminDeleteUser` Cloud
// Function'ını (functions/src/admin.ts) panelden çağırır. O fonksiyon
// istemcinin kendi hesabını silen Firebase Auth SDK akışının AKSİNE, admin
// SDK gerektiren "başka bir kullanıcıyı sil" işlemini kapsamlı bir şekilde
// (Firestore + Storage, bkz. account-deletion.ts::deleteUserData) yapıyor —
// panelin bunu YENİDEN YAZMASI yerine var olan, test edilmiş uca güvenmesi
// tercih edildi (kurucu talimatı).
//
// SORUN: adminDeleteUser bir Firebase KULLANICI ID token'ı bekliyor
// (Authorization: Bearer <ID token>, functions/src/request-auth.ts
// authenticateRequest → getAuth().verifyIdToken) ve çağıranın e-postasının
// FOUNDER_EMAILS'te + doğrulanmış olmasını şart koşuyor. Panelin kendi kimlik
// doğrulaması Supabase Auth (bkz. adminAuth.ts) — Firebase ID token'ı yok.
//
// ÇÖZÜM: panelin zaten sahip olduğu Firebase Admin SDK yetkisiyle bir kurucu
// hesabı ADINA geçici bir ID token üretilir:
//   1) auth.createCustomToken(founderUid) — Admin SDK, servis hesabının
//      private key'iyle YEREL olarak imzalar (ekstra IAM izni gerekmez).
//   2) Identity Toolkit REST'i (signInWithCustomToken) custom token'ı gerçek
//      bir ID token'a çevirir — bunun için genel/public bir Firebase Web API
//      Key gerekir (FIREBASE_WEB_API_KEY; gizli değil, istemci app'inin
//      kendi firebase_options.dart'ında zaten açık duruyor).
//   3) O ID token'la adminDeleteUser'a Bearer olarak çağrı yapılır.
//
// FIREBASE_FOUNDER_EMAIL: adına token üretilecek kurucu hesabın Firebase
// Auth e-postası — functions/src/config.ts::FOUNDER_EMAILS listesinde VE
// Firebase Auth'ta e-postası doğrulanmış (emailVerified) olmalı, aksi halde
// isFounderEmail() reddeder. Örn. karaca3888@gmail.com.

const EVENTMATCH_FUNCTIONS_BASE_URL =
  process.env.EVENTMATCH_FUNCTIONS_BASE_URL?.trim() || "https://europe-west1-eventmatch-bd8ad.cloudfunctions.net";

async function mintFounderIdToken(): Promise<string> {
  const founderEmail = process.env.FIREBASE_FOUNDER_EMAIL?.trim();
  const apiKey = process.env.FIREBASE_WEB_API_KEY?.trim();
  if (!founderEmail) {
    throw new Error(
      "FIREBASE_FOUNDER_EMAIL env değişkeni tanımlı değil — adminDeleteUser çağrısı için gerekli."
    );
  }
  if (!apiKey) {
    throw new Error("FIREBASE_WEB_API_KEY env değişkeni tanımlı değil — adminDeleteUser çağrısı için gerekli.");
  }

  const auth = getAdminAuth();
  const founder = await auth.getUserByEmail(founderEmail);
  if (!founder.emailVerified) {
    throw new Error(
      `${founderEmail} hesabının Firebase Auth'ta e-postası doğrulanmamış — adminDeleteUser bu hesabı reddeder ` +
        "(functions/src/config.ts::isFounderEmail)."
    );
  }

  const customToken = await auth.createCustomToken(founder.uid);

  const exchangeRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const exchangeBody = (await exchangeRes.json().catch(() => null)) as { idToken?: string; error?: { message?: string } } | null;
  if (!exchangeRes.ok || !exchangeBody?.idToken) {
    throw new Error(
      `Firebase custom token → ID token değişimi başarısız: ${exchangeBody?.error?.message ?? exchangeRes.status}`
    );
  }
  return exchangeBody.idToken;
}

export async function callAdminDeleteUser(targetUid: string): Promise<void> {
  const idToken = await mintFounderIdToken();

  // ÖNEMLİ AÇIK RİSK (RAPOR'da tekrarlanıyor): authenticateRequest()
  // (functions/src/request-auth.ts), FUNCTIONS_EMULATOR dışında ID token'ın
  // YANINDA geçerli bir X-Firebase-AppCheck token'ı da şart koşuyor — bu
  // panel bir sunucu süreci olduğu için gerçek bir App Check attestation'ı
  // (reCAPTCHA/DeviceCheck) üretemez. Tek meşru çözüm: Firebase Console →
  // App Check → "Manage debug tokens" altında panel için bir DEBUG TOKEN
  // kaydetmek (tek seferlik, elle) ve o sabit token'ı FIREBASE_APP_CHECK_DEBUG_TOKEN
  // env'ine koymak. Bu env boşsa header hiç gönderilmez ve çağrı muhtemelen
  // 401 döner — devreye almadan önce debug token kaydı ZORUNLU.
  const appCheckDebugToken = process.env.FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  };
  if (appCheckDebugToken) headers["X-Firebase-AppCheck"] = appCheckDebugToken;

  const res = await fetch(`${EVENTMATCH_FUNCTIONS_BASE_URL}/adminDeleteUser`, {
    method: "POST",
    headers,
    body: JSON.stringify({ targetUid }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `adminDeleteUser başarısız (${res.status}): ${body}` +
        (appCheckDebugToken ? "" : " — FIREBASE_APP_CHECK_DEBUG_TOKEN tanımlı değildi, muhtemel sebep bu.")
    );
  }
}
