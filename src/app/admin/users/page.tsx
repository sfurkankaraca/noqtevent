export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Kullanıcılar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kullanıcı yönetimi Clerk Dashboard üzerinden yapılır
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-8 space-y-4">
        <p className="text-sm text-foreground">
          Admin, DJ ve partner hesaplarını yönetmek için Clerk Dashboard'u kullan:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Yeni kullanıcı davet et</li>
          <li>Kullanıcı rollerini düzenle</li>
          <li>Hesap askıya alma / silme</li>
          <li>Oturum geçmişini görüntüle</li>
        </ul>
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity mt-2"
        >
          Clerk Dashboard'u Aç →
        </a>
      </div>
    </div>
  );
}
