import { Resend } from "resend";

const APP_FROM = "Yesp Flow <flow@yespstudio.com>";
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || "https://app.yespstudio.com";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set in environment variables.");
  return new Resend(key);
}

// ── Reporting email confirmation ──────────────────────────────────────────

export async function sendReportingEmailConfirmation(to: string) {
  const { error } = await client().emails.send({
    from: APP_FROM,
    to,
    subject: "Yesp Flow — Reporting email confirmed",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
        <div style="margin-bottom:24px">
          <span style="font-size:20px;font-weight:700;color:#1d4ed8">Yesp Flow</span>
        </div>
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">Reporting email connected ✓</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 20px">
          <strong>${to}</strong> is now your campaign reporting inbox.<br>
          After every automation run you'll receive a full PDF report with per-contact send status.
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;font-size:13px;color:#334155;margin-bottom:24px">
          <strong>Each report includes:</strong>
          <ul style="margin:8px 0 0;padding-left:18px;line-height:1.8">
            <li>Total sent / skipped / failed counts</li>
            <li>Per-contact row: email, step, status, timestamp</li>
            <li>Attached as a PDF — ready to share</li>
          </ul>
        </div>
        <p style="font-size:12px;color:#94a3b8;margin:0">
          You received this because a Yesp Flow workspace was configured to send reports here.
          If this wasn't you, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Yesp Flow — Reporting email confirmed\n\n${to} is now set as the reporting inbox.\nYou'll receive a PDF report after every campaign run.\n\nIf this wasn't you, ignore this email.`,
  });
  if (error) throw new Error(error.message);
}

// ── Test mail ─────────────────────────────────────────────────────────────

export async function sendTestMail(to: string) {
  const { error } = await client().emails.send({
    from: APP_FROM,
    to,
    subject: "Yesp Flow - Test email",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
        <div style="margin-bottom:24px">
          <span style="font-size:20px;font-weight:700;color:#1d4ed8">Yesp Flow</span>
        </div>
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">Test email received</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 20px">
          Your reporting email <strong>${to}</strong> is working correctly.<br>
          Campaign run reports will be delivered here as PDF attachments.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;font-size:13px;color:#166534;">
          Sent from <strong>flow@yespstudio.com</strong> via Yesp Flow
        </div>
      </div>
    `,
    text: `Yesp Flow - Test email\n\nYour reporting email (${to}) is working correctly.\nCampaign run reports will be delivered here as PDF attachments.`,
  });
  if (error) throw new Error(error.message);
}

// ── Team invite ───────────────────────────────────────────────────────────

export async function sendTeamInviteEmail(options: {
  to: string;
  teamName: string;
  inviterEmail: string;
  role: string;
}) {
  const { to, teamName, inviterEmail, role } = options;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const rolePerms: Record<string, string> = {
    admin:  "Invite members, create and edit campaigns, templates, and contacts",
    member: "Run campaigns and view the shared workspace",
    viewer: "Read-only access to the shared workspace",
  };

  const { error } = await client().emails.send({
    from: APP_FROM,
    to,
    subject: `${inviterEmail} invited you to join "${teamName}" on Yesp Flow`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
        <div style="margin-bottom:24px">
          <span style="font-size:20px;font-weight:700;color:#1d4ed8">Yesp Flow</span>
        </div>
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">You've been invited to a team</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 20px">
          <strong>${inviterEmail}</strong> has invited you to join
          <strong>"${teamName}"</strong> as a <strong>${roleLabel}</strong>.
        </p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;font-size:13px;color:#1e40af;margin-bottom:24px">
          <strong>As a ${roleLabel} you can:</strong>
          <ul style="margin:8px 0 0;padding-left:18px;line-height:1.8">
            <li>${rolePerms[role] ?? "Access the shared workspace"}</li>
            <li>See shared contacts, campaigns, and templates</li>
          </ul>
        </div>
        <a href="${APP_URL}/login"
           style="display:inline-block;background:#1d4ed8;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;margin-bottom:24px">
          Accept invite &amp; sign in →
        </a>
        <p style="font-size:12px;color:#94a3b8;margin:0">
          Sign in or sign up with <strong>${to}</strong> to join automatically.<br>
          If you don't want to join, ignore this email.
        </p>
      </div>
    `,
    text: `You've been invited to join "${teamName}" on Yesp Flow\n\n${inviterEmail} invited you as a ${roleLabel}.\n\nSign in at ${APP_URL}/login using ${to} to accept.\n\nIf you don't want to join, ignore this email.`,
  });
  if (error) throw new Error(error.message);
}
