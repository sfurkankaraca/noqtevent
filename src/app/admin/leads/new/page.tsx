import NewLeadForm from "./NewLeadForm";

// createLead içindeki AI analiz + yanıt üretimi için zaman aşımı payı
export const maxDuration = 60;

export default function NewLeadPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Yeni Talep</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Müşteri mesajını olduğu gibi yapıştır — AI analizi ve yanıt önerisi kayıtta otomatik üretilir.
        </p>
      </div>
      <NewLeadForm />
    </div>
  );
}
