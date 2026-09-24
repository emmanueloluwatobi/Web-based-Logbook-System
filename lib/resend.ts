import nodemailer from "nodemailer";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { notificationLog } from "@/db/schema";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
 * Generates an institutional responsive HTML email template
 * using Ekiti State University SIWES Directorate styling.
 */
function buildBrandedHtml({
  preheader,
  title,
  subtitle,
  badgeText,
  badgeColor = "#003fb1",
  contentHtml,
  ctaText,
  ctaUrl,
}: {
  preheader?: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fb; color: #1a1c20; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e1e3ec; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #003fb1 0%, #002b7a 100%); padding: 32px 28px; text-align: left; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 22px; color: #ffffff; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #d0e1fd; font-weight: 400; }
    .body-content { padding: 28px; font-size: 14px; line-height: 1.6; color: #33363f; }
    .btn { display: inline-block; background-color: #003fb1; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 20px; }
    .footer { padding: 24px 28px; text-align: center; font-size: 12px; color: #737785; border-top: 1px solid #edf0f7; background-color: #fafbfe; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#f4f6fb;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
  <div class="wrapper">
    <div class="card">
      <div class="header">
        ${badgeText ? `<span class="badge" style="background-color: #ffffff; color: ${badgeColor};">${badgeText}</span>` : ""}
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : `<p>Ekiti State University · SIWES Directorate</p>`}
      </div>
      <div class="body-content">
        ${contentHtml}
        ${ctaText && ctaUrl ? `
          <div style="text-align: left; margin-top: 24px;">
            <a href="${ctaUrl}" class="btn" target="_blank">${ctaText} &rarr;</a>
          </div>
        ` : ""}
      </div>
      <div class="footer">
        <p><strong>Ekiti State University</strong> · University Logbook System (ULS)</p>
        <p>This is an automated system notification. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escapes HTML entities to prevent HTML injection in email templates.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Unified email sender with priority:
 * 1. Gmail SMTP (via nodemailer) if GMAIL_USER + GMAIL_APP_PASSWORD exist
 * 2. Resend SDK if RESEND_API_KEY exists
 * 3. Terminal console fallback as a safety net
 */
export async function sendEmail({
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
        html: html || undefined,
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
        html: html || undefined,
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

/**
 * Records an entry into notification_log for compliance and auditing.
 * Always non-blocking; never throws.
 */
export async function logNotification({
  userId,
  type,
  message,
}: {
  userId: string;
  type:
    | "welcome_student"
    | "entry_rejected"
    | "entry_submitted"
    | "overdue_summary"
    | "placement_approved"
    | "placement_rejected"
    | "industry_invite"
    | "account_invite";
  message: string;
}): Promise<void> {
  try {
    await db.insert(notificationLog).values({
      userId,
      type,
      message,
    });
  } catch (error) {
    console.error(`[lib/resend.logNotification] Failed to log ${type} notification for ${userId}:`, error);
  }
}

// =========================================================================
// Specialized Email Dispatchers
// =========================================================================

/**
 * 1. Student Welcome Email (Option A)
 * Dispatched immediately when a student self-registers.
 */
export async function sendStudentWelcomeEmail({
  to,
  name,
  departmentName,
}: {
  to: string;
  name: string;
  departmentName?: string | null;
}): Promise<void> {
  const safeName = escapeHtml(name);
  const safeDept = escapeHtml(departmentName);
  const deptText = safeDept ? ` (${safeDept})` : "";
  const portalUrl = `${baseUrl}/student`;
  const subject = "Welcome to EKSU SIWES Portal — Next Steps for Your Attachment";

  const text = `Hello ${name},\n\nWelcome to the Ekiti State University SIWES Logbook System (ULS Portal)${departmentName ? ` (${departmentName})` : ""}.\n\nYour student account has been successfully registered. To get started with your industrial attachment:\n\n1. Complete your Student Profile (matric number, level, program, phone)\n2. Submit your Training Organization & Placement details for approval\n3. Begin logging your daily activities and attendance once your placement is confirmed\n\nAccess your dashboard: ${portalUrl}\n\nEkiti State University SIWES Directorate`;

  const contentHtml = `
    <p>Hello <strong>${safeName}</strong>,</p>
    <p>Welcome to the <strong>Ekiti State University SIWES Logbook System (ULS Portal)</strong>${deptText}. Your student account has been successfully created.</p>
    
    <div style="background-color: #eef4ff; border-left: 4px solid #003fb1; padding: 14px 18px; border-radius: 4px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #003fb1;">Next Steps to Begin Your Attachment:</h3>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e293b;">
        <li style="margin-bottom: 6px;"><strong>Complete your Profile:</strong> Fill in your matric number, level, and phone number on your dashboard.</li>
        <li style="margin-bottom: 6px;"><strong>Submit Placement:</strong> Register your self-secured industrial training organization for departmental approval.</li>
        <li><strong>Daily Logbook:</strong> Once your placement and supervisor are assigned, begin recording your daily activities and hours worked.</li>
      </ol>
    </div>

    <p style="font-size: 13px; color: #64748b;">Keep this email for your records. If you experience any issues accessing your account, please reach out to your departmental SIWES coordinator.</p>
  `;

  const html = buildBrandedHtml({
    preheader: `Welcome to EKSU SIWES Portal, ${safeName}! Here are your next onboarding steps.`,
    title: "Welcome to ULS Portal",
    subtitle: "Ekiti State University · SIWES Directorate",
    badgeText: "Student Onboarding",
    badgeColor: "#003fb1",
    contentHtml,
    ctaText: "Go to Student Dashboard",
    ctaUrl: portalUrl,
  });

  await sendEmail({ to, subject, text, html });
}

/**
 * 2. Faculty Staff Account Invite Email (Supervisors & HODs)
 */
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
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(roleName);
  const subject = `Invitation to Join ULS Portal as ${roleName}`;
  const text = `Hello ${name},\n\nYou have been invited to join the Ekiti State University SIWES Logbook System (ULS Portal) as a ${roleName}.\n\nPlease click the link below to set your password and access your dashboard:\n\n${inviteUrl}\n\nThis invitation link expires in 48 hours.\n\nEkiti State University SIWES Directorate`;

  const contentHtml = `
    <p>Hello <strong>${safeName}</strong>,</p>
    <p>You have been formally designated as a <strong>${safeRole}</strong> on the <strong>Ekiti State University SIWES Logbook System (ULS Portal)</strong>.</p>
    <p>To activate your institutional access and configure your account password, click the button below:</p>
    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 12px; color: #64748b;">
      <strong>Note:</strong> For security reasons, this setup link will expire in <strong>48 hours</strong>.
    </div>
  `;

  const html = buildBrandedHtml({
    preheader: `You've been invited as a ${safeRole} on the ULS SIWES Portal.`,
    title: `Faculty Portal Access`,
    subtitle: `Role Assignment: ${safeRole}`,
    badgeText: "Account Activation",
    badgeColor: "#003fb1",
    contentHtml,
    ctaText: "Set Your Password & Log In",
    ctaUrl: inviteUrl,
  });

  await sendEmail({ to: email, subject, text, html });
}

/**
 * 3. Logbook Entry Correction Requested (`entry_rejected`)
 * Dispatched to student when school supervisor rejects an entry.
 */
export async function sendEntryRejectedEmail({
  to,
  studentName,
  entryDate,
  comment,
  entryUrl,
}: {
  to: string;
  studentName: string;
  entryDate: string;
  comment: string;
  entryUrl?: string;
}): Promise<void> {
  const safeStudent = escapeHtml(studentName);
  const safeDate = escapeHtml(entryDate);
  const safeComment = escapeHtml(comment);
  const subject = `Correction Requested on Logbook Entry (${entryDate})`;
  const targetUrl = entryUrl || `${baseUrl}/student/logbook`;

  const text = `Hello ${studentName},\n\nYour School Supervisor has reviewed your logbook entry for ${entryDate} and requested corrections.\n\nSupervisor's Feedback:\n"${comment}"\n\nPlease review your supervisor's remarks and submit a corrected revision through your logbook:\n${targetUrl}\n\nEkiti State University SIWES Directorate`;

  const contentHtml = `
    <p>Hello <strong>${safeStudent}</strong>,</p>
    <p>Your School Supervisor has reviewed your logbook entry for <strong>${safeDate}</strong> and requested corrections before approval.</p>

    <div style="background-color: #fff8f1; border-left: 4px solid #d97706; padding: 16px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #b45309; letter-spacing: 0.5px;">Supervisor's Remarks:</p>
      <blockquote style="margin: 0; font-style: italic; color: #451a03; font-size: 14px;">"${safeComment}"</blockquote>
    </div>

    <p style="font-size: 13px; color: #475569;">
      Your original submission is preserved as part of the immutable audit record. Please edit and submit a corrected version to satisfy the supervisor's requirements.
    </p>
  `;

  const html = buildBrandedHtml({
    preheader: `Action Required: Correction requested on your ${safeDate} SIWES entry.`,
    title: "Correction Required",
    subtitle: `Entry Date: ${safeDate}`,
    badgeText: "Logbook Feedback",
    badgeColor: "#d97706",
    contentHtml,
    ctaText: "Review & Resubmit Entry",
    ctaUrl: targetUrl,
  });

  await sendEmail({ to, subject, text, html });
}

/**
 * 4. New Logbook Entry Submitted (`entry_submitted`)
 * Dispatched to the assigned School Supervisor.
 */
export async function sendEntrySubmittedEmail({
  to,
  supervisorName,
  studentName,
  entryDate,
  reviewUrl,
}: {
  to: string;
  supervisorName: string;
  studentName: string;
  entryDate: string;
  reviewUrl?: string;
}): Promise<void> {
  const safeSupervisor = escapeHtml(supervisorName);
  const safeStudent = escapeHtml(studentName);
  const safeDate = escapeHtml(entryDate);
  const subject = `New Entry Awaiting Review — ${studentName} (${entryDate})`;
  const targetUrl = reviewUrl || `${baseUrl}/supervisor`;

  const text = `Hello ${supervisorName},\n\nYour assigned student, ${studentName}, has submitted a new logbook entry for ${entryDate}.\n\nPlease review and evaluate this entry on your supervisor dashboard:\n${targetUrl}\n\nEkiti State University SIWES Directorate`;

  const contentHtml = `
    <p>Hello <strong>${safeSupervisor}</strong>,</p>
    <p>Your assigned student <strong>${safeStudent}</strong> has submitted a daily logbook entry for <strong>${safeDate}</strong> awaiting your review.</p>
    <p style="font-size: 13px; color: #475569;">You can inspect their recorded activities, challenges, and hours worked, then approve or request corrections directly from your review queue.</p>
  `;

  const html = buildBrandedHtml({
    preheader: `${safeStudent} submitted a logbook entry for ${safeDate}.`,
    title: "New Entry Submitted",
    subtitle: `Student: ${safeStudent}`,
    badgeText: "Review Queue",
    badgeColor: "#003fb1",
    contentHtml,
    ctaText: "Review Entry in Portal",
    ctaUrl: targetUrl,
  });

  await sendEmail({ to, subject, text, html });
}

/**
 * 5. Placement Approved (`placement_approved`)
 * Dispatched to the student when an Admin or HOD approves their placement.
 */
export async function sendPlacementApprovedEmail({
  to,
  studentName,
  organizationName,
  supervisorName,
  startDate,
  endDate,
}: {
  to: string;
  studentName: string;
  organizationName: string;
  supervisorName?: string | null;
  startDate: string;
  endDate: string;
}): Promise<void> {
  const safeStudent = escapeHtml(studentName);
  const safeOrg = escapeHtml(organizationName);
  const safeSupervisor = escapeHtml(supervisorName);
  const safeStart = escapeHtml(startDate);
  const safeEnd = escapeHtml(endDate);
  const subject = `SIWES Placement Approved — ${organizationName}`;
  const targetUrl = `${baseUrl}/student/placement`;

  const supervisorText = supervisorName ? `Assigned Academic Supervisor: ${supervisorName}\n` : "";
  const text = `Hello ${studentName},\n\nCongratulations! Your SIWES industrial training placement has been approved.\n\nOrganization: ${organizationName}\nTraining Period: ${startDate} to ${endDate}\n${supervisorText}\nYou may now begin recording your daily logbook entries and logging attendance.\n\nView details: ${targetUrl}\n\nEkiti State University SIWES Directorate`;

  const contentHtml = `
    <p>Hello <strong>${safeStudent}</strong>,</p>
    <p>Your SIWES placement registration has been officially reviewed and <strong>approved</strong> by your department.</p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 15px;">Placement Details:</h3>
      <table style="width: 100%; font-size: 13px; color: #1e293b; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Organization:</td>
          <td style="padding: 4px 0; font-weight: 600;">${safeOrg}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Duration:</td>
          <td style="padding: 4px 0; font-weight: 600;">${safeStart} &mdash; ${safeEnd}</td>
        </tr>
        ${safeSupervisor ? `
        <tr>
          <td style="padding: 4px 0; color: #64748b;">School Supervisor:</td>
          <td style="padding: 4px 0; font-weight: 600;">${safeSupervisor}</td>
        </tr>
        ` : ""}
      </table>
    </div>

    <p style="font-size: 13px; color: #475569;">Daily logbook submissions and attendance logging are now unlocked for your account.</p>
  `;

  const html = buildBrandedHtml({
    preheader: `Your SIWES placement at ${safeOrg} is approved!`,
    title: "Placement Approved",
    subtitle: safeOrg,
    badgeText: "Official Confirmation",
    badgeColor: "#16a34a",
    contentHtml,
    ctaText: "View Placement & Logbook",
    ctaUrl: targetUrl,
  });

  await sendEmail({ to, subject, text, html });
}

/**
 * 6. Overdue Inactivity Summary (`overdue_summary`)
 * Dispatched to HOD listing students who haven't submitted in 7+ days.
 */
export async function sendOverdueSummaryEmail({
  to,
  hodName,
  departmentName,
  overdueStudents,
}: {
  to: string;
  hodName: string;
  departmentName: string;
  overdueStudents: Array<{
    name: string;
    matricNumber?: string | null;
    daysSinceLastEntry: number;
    supervisorName?: string | null;
  }>;
}): Promise<void> {
  const safeHod = escapeHtml(hodName);
  const safeDept = escapeHtml(departmentName);
  const subject = `SIWES Inactivity Digest: ${overdueStudents.length} Overdue Students (${departmentName})`;
  const targetUrl = `${baseUrl}/hod`;

  const listText = overdueStudents
    .map(
      (s) =>
        `- ${s.name} (${s.matricNumber || "No Matric"}) — ${s.daysSinceLastEntry} days inactive (Supervisor: ${s.supervisorName || "Unassigned"})`,
    )
    .join("\n");

  const text = `Hello ${hodName},\n\nHere is the SIWES submission inactivity report for the ${departmentName} department.\n\nThe following ${overdueStudents.length} student(s) with active placements have not submitted any logbook entries in the last 7+ days:\n\n${listText}\n\nView department status: ${targetUrl}\n\nEkiti State University SIWES Directorate`;

  const rowsHtml = overdueStudents
    .map(
      (s) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: 600; color: #0f172a;">${escapeHtml(s.name)}</td>
        <td style="padding: 10px 8px; color: #475569;">${s.matricNumber ? escapeHtml(s.matricNumber) : "&mdash;"}</td>
        <td style="padding: 10px 8px; color: #dc2626; font-weight: 600;">${s.daysSinceLastEntry} days</td>
        <td style="padding: 10px 8px; color: #475569;">${s.supervisorName ? escapeHtml(s.supervisorName) : "<span style='color:#94a3b8;'>Unassigned</span>"}</td>
      </tr>
    `,
    )
    .join("");

  const contentHtml = `
    <p>Hello <strong>${safeHod}</strong>,</p>
    <p>This is your department's automated weekly SIWES submission monitoring digest. There are currently <strong>${overdueStudents.length} student(s)</strong> with active placements who have not logged any activities in the past 7 or more calendar days.</p>

    <div style="overflow-x: auto; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; color: #475569; font-weight: 600;">Student</th>
            <th style="padding: 8px; color: #475569; font-weight: 600;">Matric No</th>
            <th style="padding: 8px; color: #475569; font-weight: 600;">Inactive For</th>
            <th style="padding: 8px; color: #475569; font-weight: 600;">Supervisor</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748b;">You can review detailed student records and follow up directly with their assigned supervisors on the HOD Portal.</p>
  `;

  const html = buildBrandedHtml({
    preheader: `Weekly SIWES alert: ${overdueStudents.length} students overdue in ${safeDept}.`,
    title: "Submission Inactivity Alert",
    subtitle: `Department of ${safeDept}`,
    badgeText: "Compliance Alert",
    badgeColor: "#dc2626",
    contentHtml,
    ctaText: "Open HOD Dashboard",
    ctaUrl: targetUrl,
  });

  await sendEmail({ to, subject, text, html });
}

/**
 * 7. Magic Link / Sign-in Link Email
 */
export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const subject = "Your ULS SIWES Sign-in Link";
  const text = `Click the link below to sign in to your Industry Supervisor account:\n\n${url}\n\nThis link expires in 15 minutes. If you did not request this link, you can safely ignore this email.`;

  const contentHtml = `
    <p>Hello,</p>
    <p>Click the button below to securely sign in to your <strong>Industry Supervisor portal</strong> on the Ekiti State University SIWES Logbook System.</p>
    <p style="font-size: 12px; color: #64748b;">This passwordless magic link is single-use and expires in <strong>15 minutes</strong>.</p>
  `;

  const html = buildBrandedHtml({
    preheader: "Your single-use sign-in link for the ULS Portal.",
    title: "Sign in to ULS Portal",
    subtitle: "Industry Supervisor Access",
    badgeText: "Secure Access",
    badgeColor: "#003fb1",
    contentHtml,
    ctaText: "Sign In Securely",
    ctaUrl: url,
  });

  await sendEmail({ to: email, subject, text, html });
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string,
): Promise<void> {
  await sendEmail({ to, subject, text: message });
}

/**
 * 8. Verification OTP Email (Industry Supervisor)
 */
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const subject = `Your ULS SIWES Login Code: ${otp}`;
  const text = `Your login verification code for the Ekiti State University SIWES Industry Portal is: ${otp}\n\nThis code will expire in 15 minutes. If you did not request this code, you can safely ignore this email.\n\nEkiti State University SIWES Directorate`;

  const contentHtml = `
    <p>Hello,</p>
    <p>Here is your single-use verification code to sign in to the <strong>Industry Supervisor Portal</strong> on the Ekiti State University SIWES system:</p>
    <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
      <span style="font-family: monospace, Courier, sans-serif; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #003fb1;">
        ${otp}
      </span>
    </div>
    <p style="font-size: 13px; color: #64748b; text-align: center;">
      Enter this 6-digit code on the login screen to complete your sign-in. This code is valid for <strong>15 minutes</strong>.
    </p>
  `;

  const html = buildBrandedHtml({
    preheader: `Your 6-digit login verification code: ${otp}`,
    title: "Your Login Verification Code",
    subtitle: "Industry Supervisor Access",
    badgeText: "Security Verification",
    badgeColor: "#003fb1",
    contentHtml,
    ctaText: "Go to Industry Portal",
    ctaUrl: `${baseUrl}/login/industry`,
  });

  await sendEmail({ to: email, subject, text, html });
}

/**
 * 9. Industry Supervisor Placement Invite Email
 */
export async function sendIndustryInviteEmail({
  to,
  supervisorName,
  studentName,
  organizationName,
  loginUrl,
}: {
  to: string;
  supervisorName: string;
  studentName: string;
  organizationName: string;
  loginUrl?: string;
}): Promise<void> {
  const safeSupervisor = escapeHtml(supervisorName);
  const safeStudent = escapeHtml(studentName);
  const safeOrg = escapeHtml(organizationName);
  const targetUrl = loginUrl || `${baseUrl}/login/industry`;
  const subject = `SIWES Student Placement & Supervision — ${studentName}`;
  const text = `Hello ${supervisorName},\n\n${studentName} has registered for their Students Industrial Work Experience Scheme (SIWES) placement at ${organizationName} and assigned you as their workplace Industry Supervisor.\n\nAs their supervisor, you can access the ULS Industry Partner Portal without a password using your email address to periodically review their work and complete their monthly evaluations.\n\nAccess the portal: ${targetUrl}\n\nEkiti State University SIWES Directorate`;

  const contentHtml = `
    <p>Hello <strong>${safeSupervisor}</strong>,</p>
    <p><strong>${safeStudent}</strong> has been registered for an approved <strong>Students Industrial Work Experience Scheme (SIWES)</strong> placement at <strong>${safeOrg}</strong> under your supervision.</p>
    
    <div style="background-color: #eef4ff; border-left: 4px solid #003fb1; padding: 14px 18px; border-radius: 4px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #003fb1;">Your Role as Industry Supervisor:</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e293b; line-height: 1.6;">
        <li>Guide and mentor the student during their internship activities.</li>
        <li>Review the student's monthly logbook summary and cumulative hours worked.</li>
        <li>Submit a monthly performance score across 7 key evaluation areas (technical skills, punctuality, problem solving, teamwork, etc.).</li>
      </ul>
    </div>

    <p style="font-size: 13px; color: #475569;">
      <strong>Passwordless Access:</strong> You never need to remember a password. Whenever you access the system, you can request an instant 6-digit verification code or single-click sign-in link sent directly to this email.
    </p>
  `;

  const html = buildBrandedHtml({
    preheader: `${safeStudent} is placed at ${safeOrg} under your supervision.`,
    title: "Student Placement Notice",
    subtitle: "Ekiti State University · SIWES Directorate",
    badgeText: "Industry Partner",
    badgeColor: "#003fb1",
    contentHtml,
    ctaText: "Access Industry Portal",
    ctaUrl: targetUrl,
  });

  await sendEmail({ to, subject, text, html });
}

