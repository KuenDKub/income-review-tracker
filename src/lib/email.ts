/**
 * Send alert emails (e.g. for daily check failures). Uses SMTP env vars.
 * For production, consider SendGrid or similar.
 */

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO;

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, text } = options;
  if (!SMTP_HOST || !ALERT_EMAIL_TO) {
    console.warn("Email not configured: SMTP_HOST or ALERT_EMAIL_TO missing");
    return;
  }

  // Use nodemailer if installed; otherwise minimal fetch to a mail API or no-op
  try {
    const nodemailer = await import("nodemailer");
    const port = SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587;
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    await transporter.sendMail({
      from: SMTP_USER ?? "noreply@localhost",
      to,
      subject,
      text,
      html: options.html ?? text.replace(/\n/g, "<br>"),
    });
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err;
  }
}

export async function sendAlertEmail(reason: string): Promise<void> {
  const to = ALERT_EMAIL_TO ?? "admin@example.com";
  await sendEmail({
    to,
    subject: "Review Income & Tax Tracker — Daily check failed",
    text: `Daily check failed: ${reason}\n\nTime: ${new Date().toISOString()}`,
  });
}
