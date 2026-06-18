import { Resend } from "resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "karaca3888@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "NOQT <noreply@noqt.co>";

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

  await resend.emails.send({
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
