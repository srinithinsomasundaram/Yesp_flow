import nodemailer from "nodemailer";

const APP_FROM = '"YESP Flow" <flow@yespstudio.com>';

function getTransporter() {
  const key = process.env.APP_RESEND_KEY;
  if (!key) throw new Error("APP_RESEND_KEY is not set — cannot send app emails.");
  return nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: { user: "resend", pass: key },
  });
}

// ── Reporting email confirmation ──────────────────────────────────────────

export async function sendReportingEmailConfirmation(to: string) {
  const t = getTransporter();
  await t.sendMail({
    from: APP_FROM,
    to,
    subject: "YESP Flow — Reporting email confirmed",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
        <div style="margin-bottom:24px">
          <span style="font-size:20px;font-weight:700;color:#1d4ed8">YESP Flow</span>
        </div>
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">Reporting email connected</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 20px">
          This address (<strong>${to}</strong>) is now your campaign reporting inbox.<br>
          After every automation run, you'll receive a full PDF report with per-contact send status.
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;font-size:13px;color:#334155;margin-bottom:24px">
          <strong>What you'll get in each report:</strong>
          <ul style="margin:8px 0 0;padding-left:18px;line-height:1.8">
            <li>Total sent / skipped / failed counts</li>
            <li>Per-contact row: email, step, status, timestamp</li>
            <li>Attached as a PDF — ready to share</li>
          </ul>
        </div>
        <p style="font-size:12px;color:#94a3b8;margin:0">
          You received this because a YESP Flow workspace was configured to send reports here.
          If this wasn't you, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `YESP Flow — Reporting email confirmed\n\n${to} is now set as the reporting inbox for this workspace.\nAfter every campaign run you'll receive a PDF report with full send details.\n\nIf this wasn't you, ignore this email.`,
  });
}

// ── Team invite ───────────────────────────────────────────────────────────

export async function sendTeamInviteEmail(options: {
  to: string;
  teamName: string;
  inviterEmail: string;
  role: string;
}) {
  const { to, teamName, inviterEmail, role } = options;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.yespstudio.com";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const t = getTransporter();
  await t.sendMail({
    from: APP_FROM,
    to,
    subject: `${inviterEmail} invited you to join "${teamName}" on YESP Flow`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
        <div style="margin-bottom:24px">
          <span style="font-size:20px;font-weight:700;color:#1d4ed8">YESP Flow</span>
        </div>
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">You've been invited to a team</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 20px">
          <strong>${inviterEmail}</strong> has invited you to join the workspace
          <strong>"${teamName}"</strong> as a <strong>${roleLabel}</strong>.
        </p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;font-size:13px;color:#1e40af;margin-bottom:24px">
          <strong>What this means:</strong>
          <ul style="margin:8px 0 0;padding-left:18px;line-height:1.8">
            ${role === "admin"   ? "<li>You can invite members, create and edit campaigns, templates, and contacts</li>" : ""}
            ${role === "member"  ? "<li>You can run campaigns and view the shared workspace</li>" : ""}
            ${role === "viewer"  ? "<li>You have read-only access to the shared workspace</li>" : ""}
            <li>You share the workspace data — contacts, campaigns, templates — with the team</li>
          </ul>
        </div>
        <a href="${appUrl}/login"
           style="display:inline-block;background:#1d4ed8;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;margin-bottom:24px">
          Accept invite &amp; sign in →
        </a>
        <p style="font-size:12px;color:#94a3b8;margin:0">
          Sign in (or sign up) with <strong>${to}</strong> to join the team automatically.<br>
          If you don't want to join, you can ignore this email.
        </p>
      </div>
    `,
    text: `You've been invited to join "${teamName}" on YESP Flow\n\n${inviterEmail} invited you as a ${roleLabel}.\n\nSign in at ${appUrl}/login using ${to} to accept automatically.\n\nIf you don't want to join, ignore this email.`,
  });
}
