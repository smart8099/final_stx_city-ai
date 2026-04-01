/**
 * Email delivery service with SendGrid as primary provider,
 * SMTP (nodemailer) as fallback.
 *
 * Provider priority: SendGrid → SMTP → log URL to console.
 */
import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

// ── SendGrid ────────────────────────────────────────────────────────────────

/**
 * Initialise and return true if SendGrid is configured.
 */
function initSendGrid(): boolean {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return false;
  sgMail.setApiKey(key);
  return true;
}

// ── SMTP (nodemailer) — fallback ────────────────────────────────────────────

/**
 * Build a nodemailer SMTP transport from env vars. Returns null if not configured.
 */
function getSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  });
}

// ── Send invitation email ───────────────────────────────────────────────────

/**
 * Send an invitation email to a prospective user.
 *
 * @param opts.to - Recipient email address.
 * @param opts.inviterName - Display name of the person sending the invite.
 * @param opts.cityName - Tenant/city name, or null for global invites.
 * @param opts.role - Role name being assigned.
 * @param opts.inviteUrl - Full URL to the invitation acceptance page.
 * @returns Object indicating whether the email was sent and any fallback invite URL.
 */
export async function sendInvitationEmail(opts: {
  to: string;
  inviterName: string;
  cityName: string | null;
  role: string;
  inviteUrl: string;
}) {
  const cityLabel = opts.cityName ?? "CityAssist (Global)";
  const subject = `You've been invited to ${cityLabel}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a56db;">CityAssist</h2>
      <p><strong>${opts.inviterName}</strong> invited you to join <strong>${cityLabel}</strong> as <strong>${opts.role}</strong>.</p>
      <a href="${opts.inviteUrl}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        Accept Invitation
      </a>
      <p style="color: #718096; font-size: 13px; margin-top: 24px;">This link expires in 7 days.</p>
    </div>
  `;

  const smtpFrom = process.env.SMTP_USER;
  const sgFrom = process.env.SENDGRID_FROM_EMAIL;

  // Try SMTP first (Gmail App Password — avoids DMARC alignment issues)
  const smtp = getSmtpTransport();
  if (smtp && smtpFrom) {
    try {
      const info = await smtp.sendMail({
        from: `CityAssist <${smtpFrom}>`,
        to: opts.to,
        subject,
        html,
      });
      console.log("[email] Sent via SMTP to", opts.to, "messageId:", info.messageId);
      return { sent: true, id: info.messageId };
    } catch (err) {
      console.error("[email] SMTP failed:", err);
      // Fall through to SendGrid
    }
  }

  // Try SendGrid as fallback
  const fromEmail = sgFrom ?? smtpFrom ?? "noreply@cityassist.io";
  if (initSendGrid()) {
    try {
      const [response] = await sgMail.send({
        to: opts.to,
        from: { email: fromEmail, name: "CityAssist" },
        subject,
        html,
      });
      console.log("[email] Sent via SendGrid to", opts.to, "statusCode:", response.statusCode);
      return { sent: true, id: response.headers["x-message-id"] };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[email] SendGrid failed:", message);
    }
  }

  // Neither configured — log the URL
  console.log("[email] No email provider configured — invite URL:", opts.inviteUrl);
  return { sent: false, reason: "no_provider", inviteUrl: opts.inviteUrl };
}
