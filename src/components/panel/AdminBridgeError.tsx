import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminBridgeErrorInfo } from "@/lib/panel/appAdminBridge";

// Uygulama yönetimi köprüsü (eventmatch Firestore) çağrısı safeAdminCall()
// içinde başarısız olduğunda gösterilen KIRICI OLMAYAN durum kartı — çıplak
// Next.js hata sayfası yerine kurucunun ne eksik olduğunu anladığı bir mesaj.
// Tüm uygulama/* köprü sayfaları (ve ileride eklenecek yenileri) bunu
// kullanmalı — bkz. src/lib/panel/appAdminBridge.ts.

const KIND_COPY: Record<AdminBridgeErrorInfo["kind"], { title: string; hint: string }> = {
  config: {
    title: "Uygulama yönetimi köprüsü şu an erişilemez",
    hint: "eventmatch Firestore'una bağlanmak için gereken servis hesabı ayarı eksik veya geçersiz.",
  },
  access: {
    title: "Firestore'a ulaşıldı ama bu veri okunamadı",
    hint: "Servis hesabının bu koleksiyona erişim izni yok ya da gereken bir Firestore index'i eksik olabilir.",
  },
  unknown: {
    title: "Uygulama yönetimi köprüsü şu an erişilemez",
    hint: "Beklenmeyen bir hata oluştu — muhtemelen geçici bir ağ/servis sorunu.",
  },
};

export function AdminBridgeError({ error }: { error: AdminBridgeErrorInfo }) {
  const copy = KIND_COPY[error.kind];

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">{copy.title}</CardTitle>
        <CardDescription>{copy.hint}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-mono text-xs break-words whitespace-pre-wrap">{error.message}</p>
        </div>

        {error.kind !== "access" && (
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Kurulum adımları:</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>Firebase Console → eventmatch-bd8ad → Project settings → Service accounts → &quot;Generate new private key&quot;.</li>
              <li>
                İnen JSON&apos;u tek satır base64&apos;e çevir: <span className="font-mono">base64 -i service-account.json | tr -d &apos;\n&apos;</span>
              </li>
              <li>
                Vercel → noqteventweb → Settings → Environment Variables → <span className="font-mono">FIREBASE_SERVICE_ACCOUNT</span> (Production +
                Preview).
              </li>
              <li>İndirilen JSON dosyasını commit&apos;leme — yalnız Vercel env&apos;inde dursun.</li>
            </ol>
            <p>
              Ayrıntı: <span className="font-mono">src/lib/panel/firebaseAdmin.ts</span> başındaki yorum.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
