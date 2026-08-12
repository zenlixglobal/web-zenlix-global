import "server-only";

import { inquiryLabel, site } from "@/content/site";
import { getTransport } from "@/lib/email/transport";
import { env, isEmailConfigured } from "@/lib/env";
import type { ContactInput } from "@/lib/validation/contact";

export type EmailResult =
  | { sent: true }
  | { sent: false; reason: "not-configured" | "failed"; detail?: string };

/**
 * Notifies the team about a new enquiry.
 *
 * Never throws: the submission is already saved in Supabase by the time this
 * runs, so a mail outage must not turn into a failed submission for the
 * visitor. Failures are logged and surfaced via `email_sent_at` staying null.
 */
export async function sendContactEmail(
  input: ContactInput,
  meta: { submissionId: string },
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn(
      "[contact] SMTP credentials or CONTACT_TO_EMAIL not set — skipping email.",
      { submissionId: meta.submissionId, email: input.email },
    );
    return { sent: false, reason: "not-configured" };
  }

  const fullName = `${input.firstName} ${input.lastName}`;
  const inquiry = inquiryLabel(input.inquiryType);

  try {
    await getTransport().sendMail({
      from: env.contactFromEmail(),
      to: env.contactToEmails(),
      replyTo: input.email,
      subject: `New enquiry: ${inquiry} (${input.company})`,
      text: plainText({ fullName, inquiry, input, meta }),
      html: html({ fullName, inquiry, input, meta }),
    });

    return { sent: true };
  } catch (error) {
    console.error("[contact] Failed to send notification email", error);
    return {
      sent: false,
      reason: "failed",
      detail: error instanceof Error ? error.message : "unknown error",
    };
  }
}

type TemplateArgs = {
  fullName: string;
  inquiry: string;
  input: ContactInput;
  meta: { submissionId: string };
};

function plainText({ fullName, inquiry, input, meta }: TemplateArgs): string {
  return [
    `New enquiry via ${site.name}`,
    "",
    `Name:     ${fullName}`,
    `Email:    ${input.email}`,
    `Phone:    ${input.phone}`,
    `Company:  ${input.company}`,
    `Inquiry:  ${inquiry}`,
    "",
    "Message:",
    input.message,
    "",
    `View in admin: ${env.siteUrl()}/admin/submissions/${meta.submissionId}`,
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function html({ fullName, inquiry, input, meta }: TemplateArgs): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;width:120px;color:#5b6472;font-size:13px;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:#1b2430;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
    </tr>`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dad3c2;">
            <tr>
              <td style="background:#0a1b33;padding:24px 28px;">
                <div style="color:#c9a227;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">New Enquiry</div>
                <div style="color:#ffffff;font-size:20px;font-weight:600;margin-top:6px;">${escapeHtml(site.name)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${row("Name", fullName)}
                  ${row("Email", input.email)}
                  ${row("Phone", input.phone)}
                  ${row("Company", input.company)}
                  ${row("Inquiry", inquiry)}
                </table>
                <div style="margin-top:24px;padding-top:20px;border-top:1px solid #dad3c2;">
                  <div style="color:#5b6472;font-size:13px;margin-bottom:8px;">Message</div>
                  <div style="color:#1b2430;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(input.message)}</div>
                </div>
                <a href="${escapeHtml(env.siteUrl())}/admin/submissions/${escapeHtml(meta.submissionId)}"
                   style="display:inline-block;margin-top:28px;background:#c9a227;color:#0a1b33;padding:12px 22px;font-size:14px;font-weight:600;text-decoration:none;">
                  Open in admin
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
