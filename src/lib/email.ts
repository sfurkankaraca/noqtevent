import { Resend } from "resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "karaca3888@gmail.com";
// FROM_EMAIL must be from a Resend-verified domain (or onboarding@resend.dev for testing)
const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendInquiryNotification(inquiry: {
  name: string;
  surname: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate?: string;
  services?: string[];
}) {
  const resend = getResend();
  if (!resend) return; // RESEND_API_KEY not set — skip silently

  const serviceList = inquiry.services?.length
    ? inquiry.services.map((s) => `<li>${s}</li>`).join("")
    : "<li>—</li>";

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🎉 Yeni Talep: ${inquiry.name} ${inquiry.surname}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <h1 style="font-size:24px;margin-bottom:8px;">Yeni Deneyim Talebi</h1>
        <p style="color:#666;margin-top:0;">NOQT Experience Builder üzerinden yeni bir talep geldi.</p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#666;width:40%;">Ad Soyad</td><td style="padding:8px 0;font-weight:500;">${inquiry.name} ${inquiry.surname}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">E-posta</td><td style="padding:8px 0;"><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666;">Telefon</td><td style="padding:8px 0;">${inquiry.phone}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Etkinlik</td><td style="padding:8px 0;">${inquiry.eventType}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Tarih</td><td style="padding:8px 0;">${inquiry.eventDate ?? "Belirtilmedi"}</td></tr>
        </table>
        <div style="margin-top:16px;">
          <p style="color:#666;margin-bottom:8px;">İstenen Hizmetler:</p>
          <ul style="margin:0;padding-left:20px;">${serviceList}</ul>
        </div>
        <div style="margin-top:32px;">
          <a href="${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}/admin/inquiries"
             style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">
            Admin'de Görüntüle →
          </a>
        </div>
      </div>
    `,
  });
  if (error) console.error("[email] sendInquiryNotification failed:", error);
}

export async function sendInquiryConfirmation(inquiry: {
  name: string;
  email: string;
  eventType: string;
  eventDate?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: inquiry.email,
    subject: `Deneyim taslağın alındı — NOQT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <div style="font-size:22px;font-family:Georgia,serif;font-weight:400;margin-bottom:4px;">NOQT</div>
        <div style="font-size:11px;color:#999;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">Deneyim Stüdyosu</div>
        <h1 style="font-size:24px;font-family:Georgia,serif;font-weight:400;margin-bottom:8px;">Merhaba ${inquiry.name},</h1>
        <p style="color:#555;line-height:1.7;margin-top:0;">
          Deneyim taslağın başarıyla alındı. NOQT ekibi en kısa sürede seninle iletişime geçecek.
        </p>
        <div style="margin:28px 0;padding:20px 24px;background:#f9f8f6;border-radius:12px;">
          <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Talep Özeti</div>
          <div style="font-size:14px;color:#333;line-height:2;">
            <span style="color:#999;">Etkinlik:</span> <strong>${inquiry.eventType}</strong><br/>
            ${inquiry.eventDate ? `<span style="color:#999;">Tarih:</span> <strong>${new Date(inquiry.eventDate + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</strong>` : ""}
          </div>
        </div>
        <p style="color:#555;font-size:14px;line-height:1.7;">
          Sorularınız için bize <a href="mailto:hello@noqt.events" style="color:#1a1a1a;">hello@noqt.events</a> üzerinden ulaşabilirsiniz.
        </p>
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e8e8;font-size:12px;color:#999;">
          NOQT Deneyim Stüdyosu — noqt.events
        </div>
      </div>
    `,
  });
}

export async function sendArtistApplicationReceived(artist: {
  name: string;
  email: string;
  performer_type: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const typeLabels: Record<string, string> = {
    dj: "DJ", artist: "Solo Sanatçı", trio: "Trio / Grup",
    dance: "Dans Ekibi", band: "Bando / Orkestra",
    host: "Sunucu / MC", moderator: "Moderatör",
  };
  const typeLabel = typeLabels[artist.performer_type] ?? artist.performer_type;

  await Promise.all([
    // Sanatçıya onay maili
    resend.emails.send({
      from: FROM_EMAIL,
      to: artist.email,
      subject: `Başvurun alındı — NOQT`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
          <div style="font-size:22px;font-family:Georgia,serif;font-weight:400;margin-bottom:4px;">NOQT</div>
          <div style="font-size:11px;color:#999;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">Deneyim Stüdyosu</div>
          <h1 style="font-size:24px;font-family:Georgia,serif;font-weight:400;margin-bottom:8px;">Merhaba ${artist.name},</h1>
          <p style="color:#555;line-height:1.7;">
            <strong>${typeLabel}</strong> kategorisindeki başvurun alındı. NOQT ekibi başvurunu inceleyecek ve en kısa sürede seninle iletişime geçecek.
          </p>
          <div style="margin:28px 0;padding:20px 24px;background:#f9f8f6;border-radius:12px;font-size:14px;color:#555;line-height:1.7;">
            Değerlendirme süreci genellikle 3-5 iş günü sürmektedir. Onay verilmesi durumunda profilin NOQT platformunda yayınlanacaktır.
          </div>
          <p style="font-size:14px;color:#555;">Sorularınız için <a href="mailto:hello@noqt.events" style="color:#1a1a1a;">hello@noqt.events</a> adresine yazabilirsiniz.</p>
          <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e8e8;font-size:12px;color:#999;">NOQT Deneyim Stüdyosu — noqt.events</div>
        </div>
      `,
    }),
    // Admine bildirim
    resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🎤 Yeni Sanatçı Başvurusu: ${artist.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
          <h1 style="font-size:22px;margin-bottom:8px;">Yeni Sanatçı Başvurusu</h1>
          <p style="color:#666;margin-top:0;">NOQT başvuru formu üzerinden yeni bir sanatçı başvurusu geldi.</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#666;width:40%;">Ad Soyad</td><td style="padding:8px 0;font-weight:500;">${artist.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">E-posta</td><td style="padding:8px 0;"><a href="mailto:${artist.email}">${artist.email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666;">Tür</td><td style="padding:8px 0;">${typeLabel}</td></tr>
          </table>
          <div style="margin-top:24px;">
            <a href="${process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events"}/admin/djler"
               style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">
              Admin'de İncele →
            </a>
          </div>
        </div>
      `,
    }),
  ]);
}

export async function sendArtistApprovalNotification(artist: {
  name: string;
  email: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: artist.email,
    subject: `Başvurun onaylandı 🎉 — NOQT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <div style="font-size:22px;font-family:Georgia,serif;font-weight:400;margin-bottom:4px;">NOQT</div>
        <div style="font-size:11px;color:#999;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">Deneyim Stüdyosu</div>
        <h1 style="font-size:24px;font-family:Georgia,serif;font-weight:400;margin-bottom:8px;">Tebrikler, ${artist.name}!</h1>
        <p style="color:#555;line-height:1.7;">
          Başvurun incelendi ve <strong>NOQT sanatçı kadrosuna kabul edildin.</strong> Profilin artık platformda aktif.
        </p>
        <div style="margin:28px 0;padding:20px 24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;font-size:14px;color:#166534;line-height:1.7;">
          ✅ Profilin yayında. Etkinlik organizatörleri artık seni keşfedebilir.
        </div>
        <p style="font-size:14px;color:#555;">Herhangi bir sorun veya güncelleme için <a href="mailto:hello@noqt.events" style="color:#1a1a1a;">hello@noqt.events</a> adresine yazabilirsiniz.</p>
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e8e8;font-size:12px;color:#999;">NOQT Deneyim Stüdyosu — noqt.events</div>
      </div>
    `,
  });
}

export async function sendPartnerApplicationReceived(partner: {
  contact_name: string;
  business_name: string;
  email: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await Promise.all([
    resend.emails.send({
      from: FROM_EMAIL,
      to: partner.email,
      subject: `Başvurunuz alındı — NOQT`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
          <div style="font-size:22px;font-family:Georgia,serif;font-weight:400;margin-bottom:4px;">NOQT</div>
          <div style="font-size:11px;color:#999;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">Deneyim Stüdyosu</div>
          <h1 style="font-size:24px;font-family:Georgia,serif;font-weight:400;margin-bottom:8px;">Merhaba ${partner.contact_name || partner.business_name},</h1>
          <p style="color:#555;line-height:1.7;">
            <strong>${partner.business_name}</strong> adına yaptığınız partner başvurusu alındı. NOQT ekibi başvurunuzu inceleyecek ve en kısa sürede sizinle iletişime geçecek.
          </p>
          <div style="margin:28px 0;padding:20px 24px;background:#f9f8f6;border-radius:12px;font-size:14px;color:#555;line-height:1.7;">
            Değerlendirme süreci genellikle 3-5 iş günü sürmektedir. Onay verilmesi durumunda işletmeniz NOQT partner ağında yayınlanacaktır.
          </div>
          <p style="font-size:14px;color:#555;">Sorularınız için <a href="mailto:hello@noqt.events" style="color:#1a1a1a;">hello@noqt.events</a> adresine yazabilirsiniz.</p>
          <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e8e8;font-size:12px;color:#999;">NOQT Deneyim Stüdyosu — noqt.events</div>
        </div>
      `,
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🤝 Yeni Partner Başvurusu: ${partner.business_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
          <h1 style="font-size:22px;margin-bottom:8px;">Yeni Partner Başvurusu</h1>
          <p style="color:#666;margin-top:0;">NOQT başvuru formu üzerinden yeni bir partner başvurusu geldi.</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#666;width:40%;">İşletme Adı</td><td style="padding:8px 0;font-weight:500;">${partner.business_name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Yetkili</td><td style="padding:8px 0;">${partner.contact_name || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">E-posta</td><td style="padding:8px 0;"><a href="mailto:${partner.email}">${partner.email}</a></td></tr>
          </table>
          <div style="margin-top:24px;">
            <a href="${process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events"}/admin/partnerler"
               style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">
              Admin'de İncele →
            </a>
          </div>
        </div>
      `,
    }),
  ]);
}

export async function sendPartnerApprovalNotification(partner: {
  contact_name: string;
  business_name: string;
  email: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: partner.email,
    subject: `Başvurunuz onaylandı 🎉 — NOQT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <div style="font-size:22px;font-family:Georgia,serif;font-weight:400;margin-bottom:4px;">NOQT</div>
        <div style="font-size:11px;color:#999;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">Deneyim Stüdyosu</div>
        <h1 style="font-size:24px;font-family:Georgia,serif;font-weight:400;margin-bottom:8px;">Tebrikler!</h1>
        <p style="color:#555;line-height:1.7;">
          <strong>${partner.business_name}</strong> başvurusu incelendi ve <strong>NOQT partner ağına kabul edildiniz.</strong> İşletmeniz artık platformda aktif.
        </p>
        <div style="margin:28px 0;padding:20px 24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;font-size:14px;color:#166534;line-height:1.7;">
          ✅ Profiliniz yayında. NOQT üzerinden etkinlik organizatörleri işletmenizi keşfedebilir.
        </div>
        <p style="font-size:14px;color:#555;">Herhangi bir güncelleme için <a href="mailto:hello@noqt.events" style="color:#1a1a1a;">hello@noqt.events</a> adresine yazabilirsiniz.</p>
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e8e8;font-size:12px;color:#999;">NOQT Deneyim Stüdyosu — noqt.events</div>
      </div>
    `,
  });
}

export async function sendContactNotification(msg: {
  name: string;
  email: string;
  eventType?: string;
  message: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `💬 İletişim Formu: ${msg.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <h1 style="font-size:24px;margin-bottom:8px;">Yeni İletişim Mesajı</h1>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#666;width:40%;">Ad Soyad</td><td style="padding:8px 0;font-weight:500;">${msg.name}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">E-posta</td><td style="padding:8px 0;"><a href="mailto:${msg.email}">${msg.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666;">Etkinlik</td><td style="padding:8px 0;">${msg.eventType ?? "—"}</td></tr>
        </table>
        <div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:8px;">
          <p style="margin:0;white-space:pre-wrap;">${msg.message}</p>
        </div>
        <p style="margin-top:24px;">
          <a href="mailto:${msg.email}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">
            Yanıtla →
          </a>
        </p>
      </div>
    `,
  });
}
