import nodemailer from "nodemailer";
import { Resend } from "resend";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// Initialize Gmail SMTP transporter if credentials are provided
const gmailTransporter =
  gmailUser && gmailAppPassword
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      })
    : null;

/**
 * Unified email sender with priority:
 * 1. Gmail SMTP (via nodemailer) if GMAIL_USER + GMAIL_APP_PASSWORD exist
 * 2. Resend SDK if RESEND_API_KEY exists
 * 3. Terminal console fallback as a safety net
 */
async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  // 1. Try Gmail SMTP
  if (gmailTransporter && gmailUser) {
    try {
      await gmailTransporter.sendMail({
        from: `"ULS EKSU SIWES" <${gmailUser}>`,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      console.error("[lib/resend] Failed to send email via Gmail SMTP:", error);
      // Fall through to Resend
    }
  }

  // 2. Try Resend
  if (resend) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      console.error("[lib/resend] Failed to send email via Resend:", error);
      // Fall through to safety net
    }
  }

  // 3. Dev Safety Net Logger
  console.log("------------------------------------------------------------");
  console.log(`[EMAIL DEV SAFETY NET]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content:\n${text}`);
  console.log("------------------------------------------------------------");
  return false;
}

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const subject = "Your WESGAS Sign-in Link";
  const text = `Click the link below to sign in to your Industry Supervisor account:\n\n${url}\n\nThis link expires in 15 minutes. If you did not request this link, you can safely ignore this email.`;

  await sendEmail({ to: email, subject, text });
}

export async function sendAccountInviteEmail(
  email: string,
  name: string,
  role: string,
  inviteUrl: string,
): Promise<void> {
  const roleDisplayNames: Record<string, string> = {
    admin: "System Administrator",
    hod: "Head of Department (HOD)",
    school_supervisor: "School Supervisor",
  };

  const roleName = roleDisplayNames[role] || role;
  const subject = `Invitation to Join ULS Portal as ${roleName}`;
  const text = `Hello ${name},\n\nYou have been invited to join the Ekiti State University SIWES Logbook System (ULS Portal) as a ${roleName}.\n\nPlease click the link below to set your password and access your dashboard:\n\n${inviteUrl}\n\nThis invitation link expires in 48 hours.\n\nEkiti State University SIWES Directorate`;

  await sendEmail({ to: email, subject, text });
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string,
): Promise<void> {
  await sendEmail({ to, subject, text: message });
}
