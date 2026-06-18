import { createServiceClient } from "@/lib/supabase";

const EVENT_LABELS: Record<string, string> = {
  wedding: "Düğün", corporate: "Kurumsal", opening: "Açılış",
  "brand-launch": "Marka Lansmanı", private: "Özel Parti", other: "Diğer",
};

export default async function MesajlarPage() {
  const supabase = createServiceClient();
  const { data: messages, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">İletişim Mesajları</h1>
        <p className="text-sm text-muted-foreground mt-1">
          /iletisim formundan gelen mesajlar
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          {error.message} — supabase-migration-contact-messages.sql çalıştırıldı mı?
        </div>
      )}

      {!messages?.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-foreground font-medium">Henüz mesaj yok</p>
        </div>
      )}

      <div className="space-y-3">
        {messages?.map((msg) => (
          <div key={msg.id} className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{msg.name}</p>
                <div className="flex items-center gap-3 text-sm">
                  <a href={`mailto:${msg.email}`} className="text-foreground hover:underline">
                    {msg.email}
                  </a>
                  {msg.event_type && (
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                      {EVENT_LABELS[msg.event_type] ?? msg.event_type}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                {new Date(msg.created_at).toLocaleDateString("tr-TR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-t border-border pt-4">
              {msg.message}
            </p>
            <div className="mt-4">
              <a
                href={`mailto:${msg.email}?subject=Re: NOQT İletişim`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground border border-border rounded-full px-4 py-1.5 hover:bg-secondary transition-colors"
              >
                Yanıtla →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
