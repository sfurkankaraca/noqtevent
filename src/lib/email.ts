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
  selectedDjs?: string[];
}) {
  const resend = getResend();
  if (!resend) return; // RESEND_API_KEY not set — skip silently

  const serviceList = inquiry.services?.length
    ? inquiry.services.map((s) => `<li>${s}</li>`).join("")
    : "<li>—</li>";

  const djRow = inquiry.selectedDjs?.length
    ? `<tr><td style="padding:8px 0;color:#666;">Seçilen Sanatçılar</td><td style="padding:8px 0;font-weight:500;">${inquiry.selectedDjs.join(", ")}</td></tr>`
    : "";

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
          ${djRow}
        </table>
        <div style="margin-top:16px;">
          <p style="color:#666;margin-bottom:8px;">İstenen Hizmetler:</p>
          <ul style="margin:0;padding-left:20px;">${serviceList}</ul>
        </div>
        <div style="margin-top:32px;">
          <a href="${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/admin/inquiries"
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
    dj: "DJ", artist: "Solo Sanatçı", trio: "Trio", grup: "Grup",
    dance: "Dans Ekibi", bando: "Bando", orkestra: "Orkestra",
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
            <a href="${process.env.NEXT_PUBLIC_URL || "https://www.noqt.events"}/admin/djler"
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
        <p style="font-size:14px;color:#555;line-height:1.7;">
          Rezervasyonlarını görmek, dolu tarihlerini işaretlemek ve teknik rider'ını güncellemek için
          sanatçı panelini bu e-posta adresinle giriş yaparak kullanabilirsin.
        </p>
        <p style="margin:16px 0;">
          <a href="${process.env.NEXT_PUBLIC_URL || "https://www.noqt.events"}/dj/dashboard" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Sanatçı Panelini Aç →</a>
        </p>
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
            <a href="${process.env.NEXT_PUBLIC_URL || "https://www.noqt.events"}/admin/partnerler"
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

export async function sendRsvpConfirmation(data: {
  guestName: string;
  guestEmail: string;
  attending: boolean;
  brideName: string;
  groomName: string;
  weddingDate?: string | null;
  venueName?: string | null;
  invitationUrl: string;
  memoryDriveUrl?: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const dateStr = data.weddingDate
    ? new Date(data.weddingDate + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const memoryDriveSection = data.memoryDriveUrl
    ? `<div style="margin-top:20px;padding:16px 20px;background:#f9f8f6;border-radius:12px;font-size:14px;">
        <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Memory Drive</p>
        <p style="margin:0 0 12px;color:#333;line-height:1.6;">Etkinlik anlarını paylaşmak için Memory Drive'a fotoğraf ve video yükleyebilirsiniz.</p>
        <a href="${data.memoryDriveUrl}" style="color:#1a1a1a;font-weight:500;text-decoration:none;border-bottom:1px solid #ccc;">Memory Drive'a Git →</a>
      </div>`
    : "";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.guestEmail,
    subject: data.attending
      ? `Katılım onayınız alındı — ${data.brideName} & ${data.groomName}`
      : `Yanıtınız alındı — ${data.brideName} & ${data.groomName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;background:#fff;">
        <div style="font-size:11px;color:#999;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:32px;">NOQT.EVENTS · Dijital Davetiye</div>

        <h1 style="font-size:28px;font-family:Georgia,serif;font-weight:400;margin-bottom:4px;line-height:1.3;">
          ${data.brideName} <span style="color:#bbb;">&amp;</span> ${data.groomName}
        </h1>
        ${dateStr ? `<p style="color:#888;font-size:14px;margin-top:4px;margin-bottom:24px;">${dateStr}${data.venueName ? ` · ${data.venueName}` : ""}</p>` : ""}

        <p style="color:#333;line-height:1.7;font-size:15px;">
          Merhaba <strong>${data.guestName}</strong>,<br/>
          ${data.attending
            ? "Katılım bildiriminiz alındı. Sizi görmekten çok mutlu olacağız! 🎉"
            : "Yanıtınız alındı. İyi günler dileriz."}
        </p>

        <div style="margin:28px 0;padding:20px 24px;background:#f9f8f6;border-radius:12px;">
          <p style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Davetiye Linki</p>
          <a href="${data.invitationUrl}" style="color:#1a1a1a;font-size:14px;word-break:break-all;">${data.invitationUrl}</a>
          <p style="margin:12px 0 0;font-size:12px;color:#aaa;">Daveti paylaşmak veya PDF olarak kaydetmek için bu linki ziyaret edin.</p>
        </div>

        ${memoryDriveSection}

        <div style="margin-top:32px;">
          <a href="${data.invitationUrl}"
             style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 28px;border-radius:100px;text-decoration:none;font-size:14px;font-weight:500;">
            Daveti Görüntüle →
          </a>
        </div>

        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e8e8;font-size:12px;color:#aaa;">
          NOQT Deneyim Stüdyosu — noqt.events
        </div>
      </div>
    `,
  });
}

export async function sendArtistBookingNotification(data: {
  name: string;
  surname: string;
  email: string;
  phone: string;
  company?: string;
  artistName: string;
  eventType: string;
  eventDate?: string;
  country?: string;
  city?: string;
  venueName?: string;
  venueSocial?: string;
  isTicketed?: string;
  ticketPrice?: string;
  venueCapacity?: string;
  sponsors?: string;
  performanceType?: string;
  setDuration?: string;
  doorOpenTime?: string;
  stageTime?: string;
  curfew?: string;
  openingDj?: string;
  closingDj?: string;
  otherPerformers?: string;
  technicalConfirmed?: boolean;
  wantsNoqtEquipment?: string;
  equipmentNotes?: string;
  budget?: string;
  accommodation?: string;
  transfer?: string;
  specialRequests?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  function row(label: string, value: string | undefined | null, html = false): string {
    if (!value) return "";
    const cell = html ? value : value;
    return `<tr><td style="padding:6px 0;color:#666;width:38%;vertical-align:top;font-size:13px;">${label}</td><td style="padding:6px 0;font-weight:500;font-size:13px;">${cell}</td></tr>`;
  }

  function section(title: string, rows: string): string {
    const content = rows.trim();
    if (!content) return "";
    return `
      <tr><td colspan="2" style="padding-top:20px;padding-bottom:4px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#aaa;font-weight:600;">${title}</div>
      </td></tr>
      ${content}
    `;
  }

  const tableContent = [
    section("İletişim", [
      row("Ad Soyad", `${data.name} ${data.surname}`),
      row("Şirket", data.company),
      row("E-posta", `<a href="mailto:${data.email}" style="color:#1a1a1a;">${data.email}</a>`, true),
      row("Telefon", data.phone),
    ].join("")),

    section("Etkinlik", [
      row("Sanatçı", `<strong>${data.artistName}</strong>`, true),
      row("Etkinlik Türü", data.eventType),
      row("Tarih", data.eventDate ?? "Belirtilmedi"),
      row("Ülke", data.country),
      row("Şehir", data.city),
      row("Mekân", data.venueName),
      row("Mekân Web / Sosyal", data.venueSocial),
      row("Biletli mi?", data.isTicketed === "yes" ? "Evet" : data.isTicketed === "no" ? "Hayır" : ""),
      row("Bilet Fiyatı", data.ticketPrice),
      row("Kapasite", data.venueCapacity),
      row("Sponsorlar", data.sponsors),
    ].join("")),

    section("Performans", [
      row("Performans Türü", data.performanceType),
      row("Set Süresi", data.setDuration),
      row("Kapı Açılış", data.doorOpenTime),
      row("Sahne Saati", data.stageTime),
      row("Bitiş / Curfew", data.curfew),
      row("Ön DJ", data.openingDj),
      row("Kapanış DJ'i", data.closingDj),
      row("Diğer Sanatçılar", data.otherPerformers),
    ].join("")),

    section("Teknik", [
      row("Ekipman Onayı", data.technicalConfirmed ? "Müşteri, rider ekipmanlarının hazır olacağını onayladı" : "Onaylanmadı"),
      row("NOQT Ekipman Sağlasın mı?", data.wantsNoqtEquipment === "yes" ? "Evet" : data.wantsNoqtEquipment === "no" ? "Hayır" : ""),
      row("Ekipman Notu", data.equipmentNotes),
    ].join("")),

    section("Bütçe & Lojistik", [
      row("Bütçe", data.budget),
      row("Konaklama", data.accommodation === "yes" ? "Dahil" : data.accommodation === "no" ? "Dahil Değil" : ""),
      row("Transfer", data.transfer === "yes" ? "Dahil" : data.transfer === "no" ? "Dahil Değil" : ""),
    ].join("")),

    data.specialRequests ? section("Özel Talepler", row("", data.specialRequests)) : "",
  ].join("");

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🎤 Sanatçı Rezervasyon: ${data.artistName} — ${data.name} ${data.surname}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <h1 style="font-size:22px;margin-bottom:6px;">Yeni Sanatçı Rezervasyon Talebi</h1>
        <p style="color:#666;margin-top:0;font-size:14px;">NOQT sanatçı rezervasyon formu üzerinden yeni bir ön değerlendirme talebi geldi.</p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />
        <table style="width:100%;border-collapse:collapse;">
          ${tableContent}
        </table>
        <div style="margin-top:28px;">
          <a href="${process.env.NEXT_PUBLIC_URL || "https://www.noqt.events"}/admin/inquiries"
             style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">
            Admin'de Görüntüle →
          </a>
        </div>
      </div>
    `,
  });
  if (error) console.error("[email] sendArtistBookingNotification failed:", error);
}

export async function sendArtistBookingConfirmation(data: {
  name: string;
  email: string;
  artistName: string;
  eventType: string;
  eventDate?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `Rezervasyon ön değerlendirme talebiniz alındı — NOQT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <div style="font-size:22px;font-family:Georgia,serif;font-weight:400;margin-bottom:4px;">NOQT</div>
        <div style="font-size:11px;color:#999;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">Deneyim Stüdyosu</div>
        <h1 style="font-size:24px;font-family:Georgia,serif;font-weight:400;margin-bottom:8px;">Merhaba ${data.name},</h1>
        <p style="color:#555;line-height:1.7;">
          <strong>${data.artistName}</strong> için ön değerlendirme talebiniz başarıyla alındı. NOQT ekibi müsaitlik durumunu kontrol ederek en kısa sürede sizinle iletişime geçecek.
        </p>
        <div style="margin:28px 0;padding:20px 24px;background:#f9f8f6;border-radius:12px;">
          <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Talep Özeti</div>
          <div style="font-size:14px;color:#333;line-height:2;">
            <span style="color:#999;">Sanatçı:</span> <strong>${data.artistName}</strong><br/>
            <span style="color:#999;">Etkinlik:</span> <strong>${data.eventType}</strong><br/>
            ${data.eventDate ? `<span style="color:#999;">Tarih:</span> <strong>${new Date(data.eventDate + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</strong>` : ""}
          </div>
        </div>
        <p style="color:#555;font-size:13px;line-height:1.7;background:#fff8f0;border:1px solid #ffe0b0;padding:14px 16px;border-radius:8px;">
          Bu form rezervasyonun kesinleştiği anlamına gelmez. Müsaitlik durumu, sanatçı onayı, sözleşme imzası ve gerekli ön ödemenin alınmasına bağlıdır.
        </p>
        <p style="color:#555;font-size:14px;line-height:1.7;margin-top:20px;">
          Sorularınız için <a href="mailto:hello@noqt.events" style="color:#1a1a1a;">hello@noqt.events</a> adresine yazabilirsiniz.
        </p>
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e8e8;font-size:12px;color:#999;">
          NOQT Deneyim Stüdyosu — noqt.events
        </div>
      </div>
    `,
  });
}

export async function sendBookingContractEmails(data: {
  clientName: string;
  clientEmail: string | null;
  artistName: string;
  artistEmail: string | null;
  eventType: string | null;
  eventDate: string | null;
  venueName: string | null;
  fee: number;
  depositAmount: number;
  contractUrl: string | null;
  bookingId: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  const fmtMoney = (n: number) => n.toLocaleString("tr-TR") + " ₺";
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const contractBtn = data.contractUrl
    ? `<p style="margin-top:20px;"><a href="${data.contractUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Sözleşmeyi İndir (PDF) ↓</a></p>`
    : "";

  const baseHtml = (title: string, body: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
      <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">NOQT Experience</p>
      <h1 style="font-size:22px;font-weight:700;margin-bottom:24px;">${title}</h1>
      ${body}
      <p style="margin-top:32px;font-size:12px;color:#999;">Sorularınız için <a href="mailto:${ADMIN_EMAIL}" style="color:#1a1a1a;">${ADMIN_EMAIL}</a></p>
    </div>`;

  const detailTable = `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr><td style="padding:8px 0;color:#666;width:140px;">Etkinlik Türü</td><td style="padding:8px 0;font-weight:600;">${data.eventType ?? "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Tarih</td><td style="padding:8px 0;font-weight:600;">${fmtDate(data.eventDate)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Mekan</td><td style="padding:8px 0;font-weight:600;">${data.venueName ?? "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Sanatçı</td><td style="padding:8px 0;font-weight:600;">${data.artistName}</td></tr>
      <tr style="border-top:1px solid #eee;"><td style="padding:10px 0;color:#666;">Toplam Ücret</td><td style="padding:10px 0;font-weight:700;font-size:16px;">${fmtMoney(data.fee)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Kapora (şimdi ödenecek)</td><td style="padding:8px 0;font-weight:600;color:#b45309;">${fmtMoney(data.depositAmount)}</td></tr>
    </table>`;

  // Müşteriye
  if (data.clientEmail) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.clientEmail,
      subject: `Booking Onayı — ${data.artistName} · NOQT`,
      html: baseHtml(
        `Booking onaylandı, ${data.clientName.split(" ")[0]}! 🎉`,
        `<p style="font-size:15px;color:#444;line-height:1.6;">
          <strong>${data.artistName}</strong> ile booking'iniz onaylanmıştır.
          Sözleşmeyi inceleyip kapora ödemesini gerçekleştirdiğinizde rezervasyonunuz kesinleşecek.
        </p>
        ${detailTable}
        ${contractBtn}
        <p style="margin-top:20px;font-size:13px;color:#666;">
          Kapora ödemesi için lütfen ekibimizle iletişime geçin veya banka bilgilerini bekleyin.
        </p>`
      ),
    });
  }

  // Sanatçıya
  if (data.artistEmail) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.artistEmail,
      subject: `Yeni Booking — ${data.clientName} · ${fmtDate(data.eventDate)}`,
      html: baseHtml(
        "Yeni bir booking onaylandı",
        `<p style="font-size:15px;color:#444;line-height:1.6;">
          <strong>${data.clientName}</strong> için etkinlik booking'iniz oluşturuldu.
          Aşağıda etkinlik detaylarını bulabilirsiniz.
        </p>
        ${detailTable}
        ${contractBtn}
        <p style="margin-top:20px;font-size:13px;color:#666;">
          Etkinlik detayları veya rider konusunda herhangi bir sorunuz varsa lütfen iletişime geçin.
        </p>`
      ),
    });
  }

  // Admin bildirimi
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `✅ Sözleşme oluşturuldu — ${data.clientName} / ${data.artistName}`,
    html: baseHtml(
      "Sözleşme oluşturuldu",
      `${detailTable}
      <p><a href="${BASE}/admin/bookings/${data.bookingId}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Booking'i Görüntüle →</a></p>`
    ),
  });
}

export async function sendBookingDeliveryEmail(data: {
  clientName: string;
  clientEmail: string | null;
  artistName: string;
  deliveryUrl: string;
  photoCount: number;
  videoCount: number;
}) {
  const resend = getResend();
  if (!resend || !data.clientEmail) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.clientEmail,
    subject: `Etkinlik Teslim Raporunuz Hazır — NOQT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">NOQT Experience</p>
        <h1 style="font-size:22px;font-weight:700;margin-bottom:16px;">Etkinliğiniz için teşekkürler, ${data.clientName.split(" ")[0]}! 🎉</h1>
        <p style="font-size:15px;color:#444;line-height:1.6;">
          <strong>${data.artistName}</strong> ile gerçekleşen etkinliğinizin fotoğraf ve videolarını
          aşağıdaki linkten görüntüleyip indirebilirsiniz.
        </p>
        <p style="font-size:14px;color:#666;margin-top:12px;">
          ${data.photoCount} fotoğraf${data.videoCount ? ` · ${data.videoCount} video` : ""}
        </p>
        <p style="margin-top:24px;">
          <a href="${data.deliveryUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">
            Teslim Raporunu Görüntüle →
          </a>
        </p>
        <p style="margin-top:32px;font-size:12px;color:#999;">
          Deneyiminizle ilgili görüşlerinizi bizimle paylaşmak isterseniz her zaman buradayız.
        </p>
      </div>
    `,
  });
}

export async function sendOfferEmail(data: {
  clientName: string;
  clientEmail: string;
  artistName: string;
  offerUrl: string;
  eventType: string | null;
  eventDate: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "—";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.clientEmail,
    subject: `Teklifiniz Hazır — ${data.artistName} · NOQT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">NOQT Experience</p>
        <h1 style="font-size:22px;font-weight:700;margin-bottom:16px;">Teklifiniz hazır, ${data.clientName.split(" ")[0]}!</h1>
        <p style="font-size:15px;color:#444;line-height:1.6;">
          <strong>${data.artistName}</strong> için hazırladığımız teklifi, ödeme seçeneklerini ve
          koşulları aşağıdaki linkten inceleyip onaylayabilirsiniz.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#666;width:140px;">Etkinlik Türü</td><td style="padding:8px 0;font-weight:600;">${data.eventType ?? "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Tarih</td><td style="padding:8px 0;font-weight:600;">${fmtDate(data.eventDate)}</td></tr>
        </table>
        <p style="margin-top:20px;">
          <a href="${data.offerUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">
            Teklifi İncele →
          </a>
        </p>
        <p style="margin-top:32px;font-size:12px;color:#999;">Sorularınız için ${ADMIN_EMAIL}</p>
      </div>
    `,
  });
}

export async function sendPaymentClaimNotification(data: {
  clientName: string;
  bookingId: string;
  plan: "cash" | "prepay";
  amount: number;
}) {
  const resend = getResend();
  if (!resend) return;

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `💳 Ödeme bildirimi — ${data.clientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <h1 style="font-size:20px;font-weight:700;margin-bottom:16px;">Müşteri ödeme yaptığını bildirdi</h1>
        <p style="font-size:14px;color:#444;">
          <strong>${data.clientName}</strong> — ${data.plan === "cash" ? "Peşin" : "Ön Ödemeli"} plan —
          ${data.amount.toLocaleString("tr-TR")} ₺
        </p>
        <p style="font-size:13px;color:#666;">Banka hesap hareketlerini kontrol edip booking'i güncelleyin.</p>
        <p style="margin-top:20px;">
          <a href="${BASE}/admin/bookings/${data.bookingId}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">
            Booking'i Aç →
          </a>
        </p>
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

// Teklif dijital olarak onaylandığında: müşteriye sözleşme PDF'i eklenmiş
// onay maili + admin'e bildirim gönderir.
export async function sendOfferAcceptedEmails(data: {
  clientName: string;
  clientEmail: string | null;
  artistName: string;
  eventType: string | null;
  eventDate: string | null;
  plan: "cash" | "prepay";
  agreedPrice: number;
  depositAmount: number;
  contractUrl: string | null;
  contractPdf: Buffer | null;
  bookingId: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  const fmtMoney = (n: number) => n.toLocaleString("tr-TR") + " ₺";
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const planLabel = data.plan === "cash" ? "Peşin Ödeme" : "Ön Ödemeli";

  const detailTable = `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr><td style="padding:8px 0;color:#666;width:160px;">Sanatçı</td><td style="padding:8px 0;font-weight:600;">${data.artistName}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Etkinlik Türü</td><td style="padding:8px 0;font-weight:600;">${data.eventType ?? "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Tarih</td><td style="padding:8px 0;font-weight:600;">${fmtDate(data.eventDate)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Ödeme Planı</td><td style="padding:8px 0;font-weight:600;">${planLabel}</td></tr>
      <tr style="border-top:1px solid #eee;"><td style="padding:10px 0;color:#666;">Anlaşılan Bedel</td><td style="padding:10px 0;font-weight:700;font-size:16px;">${fmtMoney(data.agreedPrice)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Ön Ödeme / Kapora</td><td style="padding:8px 0;font-weight:600;color:#b45309;">${fmtMoney(data.depositAmount)}</td></tr>
    </table>`;

  const attachments = data.contractPdf
    ? [{ filename: `noqt-sozlesme-${data.bookingId.slice(0, 8)}.pdf`, content: data.contractPdf }]
    : undefined;

  // Müşteriye — sözleşme ekte
  if (data.clientEmail) {
    const contractLine = data.contractPdf
      ? `Sözleşmeniz bu e-postanın ekindedir${data.contractUrl ? ` — dilerseniz <a href="${data.contractUrl}" style="color:#1a1a1a;">buradan da indirebilirsiniz</a>` : ""}.`
      : data.contractUrl
        ? `Sözleşmenizi <a href="${data.contractUrl}" style="color:#1a1a1a;">buradan indirebilirsiniz</a>.`
        : "Sözleşmeniz kısa süre içinde tarafınıza iletilecektir.";

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.clientEmail,
      subject: `Rezervasyonunuz Onaylandı — ${data.artistName} · NOQT`,
      attachments,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
          <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">NOQT Experience</p>
          <h1 style="font-size:22px;font-weight:700;margin-bottom:16px;">Onayınız alındı, ${data.clientName.split(" ")[0]}! 🎉</h1>
          <p style="font-size:15px;color:#444;line-height:1.6;">
            <strong>${data.artistName}</strong> için teklifi onayladınız — rezervasyonunuz oluşturuldu.
            ${contractLine}
          </p>
          ${detailTable}
          <p style="font-size:14px;color:#444;line-height:1.6;">
            <strong>Sıradaki adım:</strong> Ödeme bilgileri için ekibimiz kısa süre içinde sizinle
            iletişime geçecek. Ödemeniz onaylandığında rezervasyonunuz kesinleşir.
          </p>
          <p style="margin-top:32px;font-size:12px;color:#999;">Sorularınız için <a href="mailto:${ADMIN_EMAIL}" style="color:#1a1a1a;">${ADMIN_EMAIL}</a></p>
        </div>`,
    });
  }

  // Admin'e bildirim
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🖊️ Teklif onaylandı — ${data.clientName} / ${data.artistName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <h1 style="font-size:20px;font-weight:700;margin-bottom:16px;">Müşteri teklifi onayladı</h1>
        <p style="font-size:14px;color:#444;"><strong>${data.clientName}</strong> — ${planLabel} — ${fmtMoney(data.agreedPrice)}</p>
        ${detailTable}
        <p style="margin-top:20px;">
          <a href="${BASE}/admin/bookings/${data.bookingId}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Booking'i Aç →</a>
        </p>
      </div>`,
  });
}

// Teklif onayı öncesi e-posta doğrulama kodu (tek kullanımlık, ~10 dk geçerli)
export async function sendOfferOtpEmail(data: {
  email: string;
  code: string;
  artistName: string;
}) {
  const resend = getResend();
  if (!resend) throw new Error("E-posta servisi yapılandırılmamış.");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `Onay Kodunuz: ${data.code} · NOQT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">NOQT Experience</p>
        <h1 style="font-size:22px;font-weight:700;margin-bottom:16px;">E-posta doğrulama kodunuz</h1>
        <p style="font-size:15px;color:#444;line-height:1.6;">
          <strong>${data.artistName}</strong> rezervasyon sözleşmesini onaylamak için aşağıdaki kodu girin.
          Kod 10 dakika geçerlidir.
        </p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;background:#f4f4f4;border-radius:12px;padding:20px;margin:24px 0;">${data.code}</p>
        <p style="font-size:12px;color:#999;">Bu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      </div>`,
  });
}

// Online ödeme (iyzico) tahsilatı sonrası: müşteriye makbuz + admin'e bildirim
export async function sendPaymentReceivedEmails(data: {
  clientName: string;
  clientEmail: string | null;
  artistName: string;
  amount: number;
  kind: "deposit" | "remaining" | "full";
  remaining: number;
  bookingId: string;
  cardLastFour: string | null;
  presskitUrl?: string | null;
  contractUrl?: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  const fmtMoney = (n: number) => n.toLocaleString("tr-TR") + " ₺";
  const kindLabel =
    data.kind === "deposit" ? "Ön ödeme (kapora)" : data.kind === "remaining" ? "Kalan ödeme" : "Tam ödeme";

  const linkButtons = [
    data.presskitUrl
      ? `<a href="${data.presskitUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:11px 20px;border-radius:100px;text-decoration:none;font-size:13px;margin:4px 8px 4px 0;">Sanatçı Presskiti →</a>`
      : "",
    data.contractUrl
      ? `<a href="${data.contractUrl}" style="display:inline-block;border:1px solid #ccc;color:#1a1a1a;padding:11px 20px;border-radius:100px;text-decoration:none;font-size:13px;margin:4px 0;">Sözleşmeyi İndir →</a>`
      : "",
  ].filter(Boolean).join("");

  // Müşteriye makbuz
  if (data.clientEmail) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.clientEmail,
      subject: `Ödemeniz Alındı — ${fmtMoney(data.amount)} · NOQT`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
          <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">NOQT Experience</p>
          <h1 style="font-size:22px;font-weight:700;margin-bottom:16px;">Ödemeniz alındı, ${data.clientName.split(" ")[0]}! ✓</h1>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
            <tr><td style="padding:8px 0;color:#666;width:160px;">Sanatçı</td><td style="padding:8px 0;font-weight:600;">${data.artistName}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Ödeme Türü</td><td style="padding:8px 0;font-weight:600;">${kindLabel}${data.cardLastFour ? ` · Kart **** ${data.cardLastFour}` : ""}</td></tr>
            <tr style="border-top:1px solid #eee;"><td style="padding:10px 0;color:#666;">Tahsil Edilen</td><td style="padding:10px 0;font-weight:700;font-size:16px;color:#15803d;">${fmtMoney(data.amount)}</td></tr>
            ${data.remaining > 0 ? `<tr><td style="padding:8px 0;color:#666;">Kalan Bakiye</td><td style="padding:8px 0;font-weight:600;color:#b45309;">${fmtMoney(data.remaining)}</td></tr>` : ""}
          </table>
          <p style="font-size:14px;color:#444;line-height:1.6;">
            ${data.remaining > 0
              ? "Rezervasyonunuz kapora ile güvence altında. Kalan ödemeyi etkinlik tarihinden önce aynı sayfadan tamamlayabilirsiniz."
              : "Ödemeniz tamamlandı — rezervasyonunuz kesinleşti. Etkinliğinizde görüşmek üzere!"}
          </p>
          ${linkButtons ? `<div style="margin-top:24px;">${linkButtons}</div>` : ""}
          <p style="margin-top:32px;font-size:12px;color:#999;">Sorularınız için <a href="mailto:${ADMIN_EMAIL}" style="color:#1a1a1a;">${ADMIN_EMAIL}</a></p>
        </div>`,
    });
  }

  // Admin'e bildirim
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `💰 Online ödeme alındı — ${data.clientName} · ${fmtMoney(data.amount)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <h1 style="font-size:20px;font-weight:700;margin-bottom:16px;">iyzico üzerinden ödeme alındı</h1>
        <p style="font-size:14px;color:#444;">
          <strong>${data.clientName}</strong> — ${kindLabel} — <strong style="color:#15803d;">${fmtMoney(data.amount)}</strong>
          ${data.remaining > 0 ? `<br/>Kalan bakiye: ${fmtMoney(data.remaining)}` : "<br/>Ödeme tamamlandı ✓"}
        </p>
        <p style="margin-top:20px;">
          <a href="${BASE}/admin/bookings/${data.bookingId}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Booking'i Aç →</a>
        </p>
      </div>`,
  });
}

// Ödeme hatırlatması — etkinliğe belirli gün kala, kalan bakiyesi olan booking'lere
export async function sendPaymentReminderEmail(data: {
  clientName: string;
  clientEmail: string;
  artistName: string;
  eventDate: string;
  daysLeft: number;
  dueAmount: number;
  offerUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const fmtMoney = (n: number) => n.toLocaleString("tr-TR") + " ₺";
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.clientEmail,
    subject: `Hatırlatma: Etkinliğinize ${data.daysLeft} gün kaldı — Ödeme · NOQT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">NOQT Experience</p>
        <h1 style="font-size:22px;font-weight:700;margin-bottom:16px;">Etkinliğinize ${data.daysLeft} gün kaldı, ${data.clientName.split(" ")[0]}!</h1>
        <p style="font-size:15px;color:#444;line-height:1.6;">
          <strong>${data.artistName}</strong> ile ${fmtDate(data.eventDate)} tarihli etkinliğiniz için
          kalan ödemenizi tamamlamanızı hatırlatmak isteriz.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
          <tr><td style="padding:8px 0;color:#666;">Kalan Bakiye</td><td style="padding:8px 0;font-weight:700;font-size:16px;color:#b45309;">${fmtMoney(data.dueAmount)}</td></tr>
        </table>
        <p style="margin-top:20px;">
          <a href="${data.offerUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Kartla Öde →</a>
        </p>
        <p style="margin-top:24px;font-size:12px;color:#999;">Ödemenizi zaten yaptıysanız bu e-postayı yok sayabilirsiniz.</p>
      </div>`,
  });
}

// Teklif ilk kez açıldığında admin'e bildirim ("sıcakken ara")
export async function sendOfferViewedNotification(data: {
  clientName: string;
  artistName: string;
  bookingId: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `👀 Teklif açıldı — ${data.clientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <h1 style="font-size:20px;font-weight:700;margin-bottom:16px;">Müşteri teklifi görüntüledi</h1>
        <p style="font-size:14px;color:#444;"><strong>${data.clientName}</strong> — ${data.artistName} teklifini az önce açtı. Şimdi aramak iyi bir zaman olabilir.</p>
        <p style="margin-top:20px;">
          <a href="${BASE}/admin/bookings/${data.bookingId}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Booking'i Aç →</a>
        </p>
      </div>`,
  });
}

// Müşteri teklif sayfasından sanatçı/konsept seçimini gönderdiğinde admin'e bildirim
export async function sendOfferSelectionNotification(data: {
  clientName: string;
  bookingId: string;
  artistName: string | null;
  conceptName: string | null;
  note: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  const rows = [
    data.artistName ? `<tr><td style="padding:8px 0;color:#666;">Seçilen Sanatçı</td><td style="padding:8px 0;font-weight:600;">${data.artistName}</td></tr>` : "",
    data.conceptName ? `<tr><td style="padding:8px 0;color:#666;">Seçilen Konsept</td><td style="padding:8px 0;font-weight:600;">${data.conceptName}</td></tr>` : "",
    data.note ? `<tr><td style="padding:8px 0;color:#666;">Not</td><td style="padding:8px 0;">${data.note}</td></tr>` : "",
  ].join("");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🎯 Teklif seçimi geldi — ${data.clientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <h1 style="font-size:20px;font-weight:700;margin-bottom:16px;">Müşteri tercihini gönderdi</h1>
        <p style="font-size:14px;color:#444;"><strong>${data.clientName}</strong> teklif sayfasındaki seçeneklerden tercihini yaptı:</p>
        <table style="width:100%;font-size:14px;margin-top:12px;">${rows}</table>
        <p style="margin-top:20px;">
          <a href="${BASE}/admin/bookings/${data.bookingId}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Booking'i Aç →</a>
        </p>
      </div>`,
  });
}

// Etkinlik sonrası değerlendirme isteği
export async function sendReviewRequestEmail(data: {
  clientName: string;
  clientEmail: string;
  artistName: string;
  reviewUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.clientEmail,
    subject: `Etkinliğiniz nasıldı? — NOQT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">NOQT Experience</p>
        <h1 style="font-size:22px;font-weight:700;margin-bottom:16px;">Etkinliğiniz nasıldı, ${data.clientName.split(" ")[0]}?</h1>
        <p style="font-size:15px;color:#444;line-height:1.6;">
          <strong>${data.artistName}</strong> ile geçirdiğiniz etkinlik hakkında birkaç kelime yazmanız
          bizim için çok değerli. 1 dakikanızı ayırabilir misiniz?
        </p>
        <p style="margin-top:24px;">
          <a href="${data.reviewUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Değerlendirme Bırak →</a>
        </p>
        <p style="margin-top:32px;font-size:12px;color:#999;">Teşekkür ederiz — NOQT Experience</p>
      </div>`,
  });
}

// Virgülle ayrılmış e-posta listesini diziye çevirir
function parseEmails(raw: string): string[] {
  return raw.split(",").map((e) => e.trim()).filter(Boolean);
}

// Her RSVP yanıtında gelin & damata bildirim
export async function sendRsvpNotificationToCouple(data: {
  coupleEmail: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  message?: string | null;
  brideName?: string | null;
  groomName?: string | null;
  invitationUrl?: string | null;
}) {
  const resend = getResend();
  if (!resend) return;
  const to = parseEmails(data.coupleEmail);
  if (!to.length) return;

  const status = data.attending
    ? `<span style="color:#16a34a;font-weight:600;">Katılıyor ✓</span>`
    : `<span style="color:#dc2626;font-weight:600;">Katılamıyor</span>`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${data.attending ? "✅" : "❌"} Yeni RSVP: ${data.guestName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">Davetiye · RSVP</p>
        <h1 style="font-size:22px;font-weight:700;margin-bottom:16px;">Yeni bir yanıt geldi</h1>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#666;width:40%;">Misafir</td><td style="padding:8px 0;font-weight:500;">${data.guestName}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Durum</td><td style="padding:8px 0;">${status}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Kişi sayısı</td><td style="padding:8px 0;">${data.guestCount}</td></tr>
          ${data.message ? `<tr><td style="padding:8px 0;color:#666;vertical-align:top;">Not</td><td style="padding:8px 0;">${data.message}</td></tr>` : ""}
        </table>
        ${data.invitationUrl ? `<p style="margin-top:24px;"><a href="${data.invitationUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Davetiyeyi Aç →</a></p>` : ""}
        <p style="margin-top:32px;font-size:12px;color:#999;">NOQT · Dijital Davetiye</p>
      </div>`,
  });
  if (error) console.error("[email] sendRsvpNotificationToCouple failed:", error);
}

// Memory Drive'a yeni yükleme(ler) olduğunda gelin & damata bildirim + galeri linki
export async function sendMemoryUploadNotification(data: {
  coupleEmail: string;
  eventTitle: string;
  galleryUrl: string;
  uploaderName?: string | null;
}) {
  const resend = getResend();
  if (!resend) return;
  const to = parseEmails(data.coupleEmail);
  if (!to.length) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `📸 Memory Drive'a yeni anılar yüklendi`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
        <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:4px;">Memory Drive</p>
        <h1 style="font-size:22px;font-weight:700;margin-bottom:12px;">${data.eventTitle}</h1>
        <p style="font-size:15px;color:#444;line-height:1.6;">
          ${data.uploaderName ? `<strong>${data.uploaderName}</strong> ` : "Bir misafiriniz "}
          galerinize yeni fotoğraf/video ekledi. Aşağıdaki bağlantıdan tüm anıları görebilir ve indirebilirsiniz.
        </p>
        <p style="margin-top:24px;">
          <a href="${data.galleryUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px;">Galeriyi Aç →</a>
        </p>
        <p style="margin-top:32px;font-size:12px;color:#999;">Bu bağlantı size özeldir — dilediğiniz zaman geri dönebilirsiniz. NOQT · Memory Drive</p>
      </div>`,
  });
  if (error) console.error("[email] sendMemoryUploadNotification failed:", error);
}
