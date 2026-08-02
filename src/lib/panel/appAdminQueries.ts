import { getAdminFirestore } from "@/lib/panel/firebaseAdmin";
import { FieldPath, Timestamp } from "firebase-admin/firestore";

// Uygulama yönetimi (eventmatch Firestore) okuma yardımcıları — çağrılmadan
// önce requirePanelAdminUser() ile kapı kontrolü YAPILMIŞ olmalı (bu dosya
// kendi içinde kontrol etmez, bkz. src/lib/panel/adminQueries.ts deseni).
//
// Alan adları/koleksiyonlar eventmatch'in mevcut Flutter admin ekranları ve
// Cloud Functions'larıyla (functions/src/admin-stats.ts, lib/screens/
// admin_users_screen.dart, lib/services/feedback_service.dart) BİREBİR
// eşleşmeli — bu dosya o kaynaklardan taşındı.

export const APP_ADMIN_PAGE_SIZE = 50;

// ── Kullanıcılar (uygulama/kullanicilar) ────────────────────────────────────

export interface AppUserRow {
  id: string;
  name: string; // userIdentities/{uid}.name — users.name fallback'i YOK (Flutter deseni)
  city: string | null;
  isBot: boolean; // "demo_" önekli uid
  verified: boolean; // verificationStatus === 'verified'
  premiumTier: string | null; // 'gold' | 'silver' | null
  banned: boolean;
  createdAt: Date | null;
}

// Firestore'da isme göre arama/tam-metin indeksleme yok — admin_users_screen.dart'ın
// yaptığı gibi son N kaydı çekip istemci tarafında (burada: server action
// içinde) süzüyoruz. Arama girildiğinde daha geniş bir pencere (500) taranır;
// aksi halde normal 50'lik sayfalama.
export async function listUsersAdmin(opts: { search?: string; cursorId?: string | null }): Promise<{
  rows: AppUserRow[];
  nextCursorId: string | null;
}> {
  const db = getAdminFirestore();
  const search = opts.search?.trim().toLowerCase() ?? "";
  const fetchLimit = search ? 500 : APP_ADMIN_PAGE_SIZE;

  let query = db.collection("users").orderBy("createdAt", "desc").limit(fetchLimit);
  if (!search && opts.cursorId) {
    const cursorDoc = await db.collection("users").doc(opts.cursorId).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }
  const snap = await query.get();
  const docs = snap.docs;

  // userIdentities toplu okuma (whereIn 30'luk parçalarla — Firestore sınırı)
  const identities = new Map<string, { name?: string }>();
  const ids = docs.map((d) => d.id);
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    if (chunk.length === 0) continue;
    const identitySnap = await db
      .collection("userIdentities")
      .where(FieldPath.documentId(), "in", chunk)
      .get();
    for (const doc of identitySnap.docs) identities.set(doc.id, doc.data() as { name?: string });
  }

  let rows: AppUserRow[] = docs.map((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt as Timestamp | undefined;
    return {
      id: doc.id,
      name: identities.get(doc.id)?.name ?? "Kullanıcı",
      city: (data.city as string | undefined) ?? null,
      isBot: doc.id.startsWith("demo_"),
      verified: data.verificationStatus === "verified",
      premiumTier: (data.premiumTier as string | undefined) ?? null,
      banned: data.banned === true,
      createdAt: createdAt ? createdAt.toDate() : null,
    };
  });

  let nextCursorId: string | null = docs.length === fetchLimit ? docs[docs.length - 1].id : null;

  if (search) {
    rows = rows.filter((r) => r.name.toLowerCase().includes(search) || r.id.toLowerCase().includes(search));
    nextCursorId = null; // arama modunda sayfalama yok (tek geniş pencere)
  }

  return { rows, nextCursorId };
}

export async function setUserBanned(userId: string, banned: boolean): Promise<void> {
  const db = getAdminFirestore();
  await db.collection("users").doc(userId).set({ banned }, { merge: true });
}

// ── Geri bildirim (uygulama/geribildirim) ───────────────────────────────────

export interface AppFeedbackRow {
  id: string;
  category: string;
  message: string;
  appVersion: string;
  platform: string;
  status: "new" | "triaged" | "done";
  createdAt: Date | null;
  imageUrl: string | null;
}

export const FEEDBACK_STATUSES = ["new", "triaged", "done"] as const;

export async function listFeedbackAdmin(status: (typeof FEEDBACK_STATUSES)[number]): Promise<AppFeedbackRow[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection("feedback")
    .where("status", "==", status)
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    const createdAt = d.createdAt as Timestamp | undefined;
    return {
      id: doc.id,
      category: (d.category as string) ?? "Diğer",
      message: (d.message as string) ?? "",
      appVersion: (d.appVersion as string) ?? "?",
      platform: (d.platform as string) ?? "?",
      status: ((d.status as string) ?? "new") as AppFeedbackRow["status"],
      createdAt: createdAt ? createdAt.toDate() : null,
      imageUrl: (d.imageUrl as string | undefined) ?? null,
    };
  });
}

export async function getFeedbackStatusCounts(): Promise<Record<(typeof FEEDBACK_STATUSES)[number], number>> {
  const db = getAdminFirestore();
  const [newCount, triagedCount, doneCount] = await Promise.all(
    FEEDBACK_STATUSES.map((s) => db.collection("feedback").where("status", "==", s).count().get())
  );
  return { new: newCount.data().count, triaged: triagedCount.data().count, done: doneCount.data().count };
}

export async function setFeedbackStatus(feedbackId: string, status: (typeof FEEDBACK_STATUSES)[number]): Promise<void> {
  const db = getAdminFirestore();
  await db.collection("feedback").doc(feedbackId).update({ status, statusUpdatedAt: new Date() });
}

// ── İstatistikler (uygulama/istatistikler) ──────────────────────────────────
// functions/src/admin-stats.ts'in (adminStats HTTP fonksiyonu) Admin SDK
// karşılığı — aynı sayaçlar, doğrudan Firestore count() aggregate ile
// (panelin zaten Admin SDK erişimi var, ekstra bir Cloud Function çağrısına
// gerek yok).

export interface AppStats {
  users: number; // bot hariç
  bots: number;
  newUsers7d: number;
  newUsers30d: number;
  matches: number;
  plans: number; // goTogether koleksiyonu
  activePlans: number; // eventDate (yoksa createdAt) gelecekte olan plan sayısı
  verifiedMeetups: number;
  openReports: number;
  newFeedback: number;
  pendingVerifications: number;
  savedVenues: number; // collectionGroup('savedVenues') — functions/src/admin-stats.ts ile birebir
  eventInterest: number; // collectionGroup('eventSwipes') where going==true — admin-stats.ts ile birebir
}

export async function getAppStats(): Promise<AppStats> {
  const db = getAdminFirestore();
  const now = Date.now();
  const weekAgo = Timestamp.fromMillis(now - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = Timestamp.fromMillis(now - 30 * 24 * 60 * 60 * 1000);

  const [
    allUsers,
    bots,
    newAllUsers7d,
    newBots7d,
    newAllUsers30d,
    newBots30d,
    matches,
    plans,
    verifiedMeetups,
    openReports,
    newFeedback,
    pendingVerifications,
    savedVenues,
    eventInterest,
    activePlans,
  ] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("users").where("isAiBot", "==", true).count().get(),
    db.collection("users").where("createdAt", ">", weekAgo).count().get(),
    db.collection("users").where("isAiBot", "==", true).where("createdAt", ">", weekAgo).count().get(),
    db.collection("users").where("createdAt", ">", monthAgo).count().get(),
    db.collection("users").where("isAiBot", "==", true).where("createdAt", ">", monthAgo).count().get(),
    db.collection("matches").count().get(),
    db.collection("goTogether").count().get(),
    db.collection("meetups").where("verified", "==", true).count().get(),
    db.collection("reports").where("status", "==", "new").count().get(),
    db.collection("feedback").where("status", "==", "new").count().get(),
    db.collection("users").where("verificationStatus", "==", "pending").count().get(),
    // eski statik panelde venues.saverCount alanı ve kullanıcı başına savedVenues
    // dizisi toplanıyordu; veri modeli kullanıcı altı savedVenues ALT KOLEKSİYONUNA
    // taşındı (bkz. eventmatch/functions/src/account-deletion.ts:104), bu yüzden
    // artık admin-stats.ts'teki gibi tek bir collectionGroup count() yeterli.
    db.collectionGroup("savedVenues").count().get(),
    // Aynı şekilde eski panelin `joinedEvents` dizi uzunluğu toplamı yerini
    // `eventSwipes` alt koleksiyonundaki going==true kayıtlarına bıraktı.
    db.collectionGroup("eventSwipes").where("going", "==", true).count().get(),
    // Firestore'da "eventDate YOKSA createdAt, o da gelecekteyse aktif say" gibi
    // OR mantığı tek bir count() sorgusuyla ifade edilemiyor — plan koleksiyonu
    // küçük olduğu için yalnız gereken 2 alanı select() ile çekip burada süzüyoruz.
    (async () => {
      const snap = await db.collection("goTogether").select("eventDate", "createdAt").get();
      const nowDate = new Date();
      let activeCount = 0;
      for (const doc of snap.docs) {
        const data = doc.data();
        const eventDate = (data.eventDate as Timestamp | undefined)?.toDate() ?? null;
        const createdAt = (data.createdAt as Timestamp | undefined)?.toDate() ?? null;
        const t = eventDate ?? createdAt;
        if (!t || t > nowDate) activeCount++;
      }
      return activeCount;
    })(),
  ]);

  const allUsersCount = allUsers.data().count;
  const botsCount = bots.data().count;

  return {
    users: Math.max(0, allUsersCount - botsCount),
    bots: botsCount,
    newUsers7d: Math.max(0, newAllUsers7d.data().count - newBots7d.data().count),
    newUsers30d: Math.max(0, newAllUsers30d.data().count - newBots30d.data().count),
    matches: matches.data().count,
    plans: plans.data().count,
    activePlans,
    verifiedMeetups: verifiedMeetups.data().count,
    openReports: openReports.data().count,
    newFeedback: newFeedback.data().count,
    pendingVerifications: pendingVerifications.data().count,
    savedVenues: savedVenues.data().count,
    eventInterest: eventInterest.data().count,
  };
}

// ── Kullanıcı profili tamamlama (İstatistikler sayfası — "Kullanıcı profili") ──
// Doğrulanmış/Gold sayıları tek alanlı count() sorgularıyla çıkarılabiliyor.
// "Fotoğraf yükleyen" ise artık users dokümanında DEĞİL — gerçek ad/fotoğraf
// yolu yetkili kasası `userIdentities/{uid}.profileImagePath` alanında (bkz.
// eventmatch/lib/services/identity_service.dart üstündeki yorum). Demo/AI
// botlar bu kasaya hiç yazmıyor (demo_seed_service.dart doğrudan users'a
// yazıyor), bu yüzden userIdentities üzerindeki count() zaten yalnız gerçek
// kullanıcıları sayar — ayrı bir bot filtresi gerekmez.

export interface UserProfileStats {
  verified: number;
  gold: number;
  withPhoto: number;
}

export async function getUserProfileStats(): Promise<UserProfileStats> {
  const db = getAdminFirestore();
  const [verified, gold, withPhoto] = await Promise.all([
    db.collection("users").where("verificationStatus", "==", "verified").count().get(),
    // premiumExpiresAt son kullanma kontrolü (user.dart:219-224) burada basitlik
    // için ATLANIYOR — v1 lansımında zaten "hepsi ücretsiz" olduğundan sayı
    // düşük/sıfır bekleniyor, bkz. sayfadaki not.
    db.collection("users").where("premiumTier", "in", ["gold", "silver"]).count().get(),
    db.collection("userIdentities").where("profileImagePath", "!=", null).count().get(),
  ]);
  return {
    verified: verified.data().count,
    gold: gold.data().count,
    withPhoto: withPhoto.data().count,
  };
}

// ── Günlük kayıt / şehir / cinsiyet kırılımı ────────────────────────────────
// Firestore'da GROUP BY yok ve "okAnswers haritası boş değil" gibi bir koşul
// count() aggregate'e çevrilemiyor — bu yüzden TEK bir select() taramasıyla
// (yalnız gereken 5 alan) tüm users koleksiyonu (~100 doküman, kabul
// edilebilir) çekilip burada kırılıyor. NOT: kullanıcı sayısı 1000+'a
// çıkarsa bu tam taramanın yerini önceden hesaplanmış bir aggregate
// koleksiyonu (ör. Cloud Function'ın günlük/şehir sayaçlarını yazdığı
// stats/daily, stats/cities dokümanları) almalı.

export interface UserBreakdowns {
  dailySignups: { dayKey: string; dateLabel: string; count: number }[]; // son 14 gün, AI hariç
  cities: { label: string; count: number }[]; // çoktan aza, ilk 10
  genders: { label: string; count: number }[]; // çoktan aza, ilk 5
  answeredQuestions: number; // okAnswers doldurmuş, AI hariç
  scannedUsers: number; // tarama sırasında bulunan gerçek (bot hariç) kullanıcı sayısı
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getUserBreakdowns(days = 14): Promise<UserBreakdowns> {
  const db = getAdminFirestore();
  const snap = await db.collection("users").select("createdAt", "isAiBot", "city", "gender", "okAnswers").get();

  const daily = new Map<string, number>();
  const cities = new Map<string, number>();
  const genders = new Map<string, number>();
  let answeredQuestions = 0;
  let scannedUsers = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.isAiBot === true) continue; // AI tanıtım profilleri büyüme/kırılım sayılarına dahil değil
    scannedUsers++;

    const createdAt = (data.createdAt as Timestamp | undefined)?.toDate() ?? null;
    if (createdAt) {
      const key = dayKey(createdAt);
      daily.set(key, (daily.get(key) ?? 0) + 1);
    }

    const city = ((data.city as string | undefined) ?? "").trim();
    if (city) cities.set(city, (cities.get(city) ?? 0) + 1);

    const gender = ((data.gender as string | undefined) ?? "").trim();
    if (gender) genders.set(gender, (genders.get(gender) ?? 0) + 1);

    const okAnswers = data.okAnswers as Record<string, unknown> | undefined;
    if (okAnswers && Object.keys(okAnswers).length > 0) answeredQuestions++;
  }

  const today = new Date();
  const dailySignups: UserBreakdowns["dailySignups"] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = dayKey(d);
    dailySignups.push({ dayKey: key, dateLabel: `${d.getDate()}.${d.getMonth() + 1}`, count: daily.get(key) ?? 0 });
  }

  const toSortedList = (m: Map<string, number>, max: number) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([label, count]) => ({ label, count }));

  return {
    dailySignups,
    cities: toSortedList(cities, 10),
    genders: toSortedList(genders, 5),
    answeredQuestions,
    scannedUsers,
  };
}

// ── Keşif sağlığı (İstatistikler sayfasının ikinci bölümü) ─────────────────
// supplyEvents/artistProfiles/venueProfiles — Supabase→Firestore sync
// worker'ının projekte ettiği koleksiyonlar (ETKINLIK_KESIF_V1_TASARIM.md
// §3.1). Sync worker henüz kurulmadıysa bu koleksiyonlar boş/yok olabilir —
// count() sorguları o durumda 0 döner, hata fırlatmaz.

const SUPPLY_EVENT_STATUSES = ["confirmed", "pending_counterparty", "cancelled"] as const;

export interface SupplyHealth {
  eventStatusCounts: Record<(typeof SUPPLY_EVENT_STATUSES)[number], number>;
  artistProfiles: number;
  venueProfiles: number;
  lastSync: { runAt: Date | null; status: string | null } | null;
}

export async function getSupplyHealth(): Promise<SupplyHealth> {
  const db = getAdminFirestore();
  const [statusCounts, artistCount, venueCount, syncDoc] = await Promise.all([
    Promise.all(
      SUPPLY_EVENT_STATUSES.map((s) => db.collection("supplyEvents").where("status", "==", s).count().get())
    ),
    db.collection("artistProfiles").count().get(),
    db.collection("venueProfiles").count().get(),
    db.collection("config").doc("supplySync").get(),
  ]);

  const eventStatusCounts = SUPPLY_EVENT_STATUSES.reduce(
    (acc, status, i) => {
      acc[status] = statusCounts[i].data().count;
      return acc;
    },
    {} as Record<(typeof SUPPLY_EVENT_STATUSES)[number], number>
  );

  const syncData = syncDoc.exists ? syncDoc.data() : null;
  const lastRunAt = syncData?.lastRunAt as Timestamp | undefined;

  return {
    eventStatusCounts,
    artistProfiles: artistCount.data().count,
    venueProfiles: venueCount.data().count,
    lastSync: syncData
      ? { runAt: lastRunAt ? lastRunAt.toDate() : null, status: (syncData.lastRunStatus as string) ?? null }
      : null,
  };
}
