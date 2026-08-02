import "server-only";

import { Resend } from "resend";

import { inquiryLabel, site } from "@/content/site";
import { env, isEmailConfigured } from "@/lib/env";
import type { ContactInput } from "@/lib/validation/contact";

import type { EmailResult } from "@/lib/email/send-contact-email";

/**
 * Confirms to the visitor that their enquiry landed.
 *
 * Separate from the team notification on purpose. This one goes to an address
 * a stranger typed into a public form, so it must:
 *   * never echo anything back that could be used to bounce content off the
 *     domain — the message body is deliberately NOT included,
 *   * reply-to the team inbox, so a reply reaches a human rather than the
 *     unmonitored notifications mailbox,
 *   * never affect whether the submission is considered accepted.
 *
 * Like the team notification it never throws: the enquiry is already saved by
 * the time this runs.
 */
export async function sendEnquirerAcknowledgement(
  input: ContactInput,
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn("[contact] email not configured — skipping acknowledgement.", {
      email: input.email,
    });
    return { sent: false, reason: "not-configured" };
  }

  const resend = new Resend(env.resendApiKey());
  const replyTo = env.contactToEmails();
  const inquiry = inquiryLabel(input.inquiryType);

  try {
    const { error } = await resend.emails.send({
      from: env.contactFromEmail(),
      to: [input.email],
      // A reply to a "we got your message" email is a real reply. Send it to
      // the team, not to the no-reply sender.
      ...(replyTo.length > 0 ? { replyTo } : {}),
      subject: `We've received your enquiry — ${site.name}`,
      text: plainText(input, inquiry),
      html: html(input, inquiry),
    });

    if (error) {
      console.error("[contact] Resend rejected the acknowledgement", error);
      return { sent: false, reason: "failed", detail: error.message };
    }

    return { sent: true };
  } catch (error) {
    console.error("[contact] Failed to send acknowledgement", error);
    return {
      sent: false,
      reason: "failed",
      detail: error instanceof Error ? error.message : "unknown error",
    };
  }
}

function plainText(input: ContactInput, inquiry: string): string {
  return [
    `Hi ${input.firstName},`,
    "",
    `Thank you for getting in touch with ${site.name}. Your enquiry has reached`,
    "our team and someone will follow up with you shortly.",
    "",
    "For your records, here is what you sent:",
    "",
    `  Inquiry:  ${inquiry}`,
    `  Company:  ${input.company}`,
    `  Email:    ${input.email}`,
    `  Phone:    ${input.phone}`,
    "",
    "If any of that is wrong, or you need to add something, just reply to this",
    "email and it will reach us directly.",
    "",
    `— The ${site.name} team`,
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

/** Same navy/gold shell as the team notification, so the two look related. */
function html(input: ContactInput, inquiry: string): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;width:110px;color:#5b6472;font-size:13px;">${escapeHtml(label)}</td>
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
                <div style="color:#c9a227;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">Enquiry Received</div>
                <div style="color:#ffffff;font-size:20px;font-weight:600;margin-top:6px;">${escapeHtml(site.name)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;color:#1b2430;font-size:15px;line-height:1.6;">
                  Hi ${escapeHtml(input.firstName)},
                </p>
                <p style="margin:0 0 24px;color:#1b2430;font-size:15px;line-height:1.6;">
                  Thank you for getting in touch with ${escapeHtml(site.name)}. Your enquiry
                  has reached our team and someone will follow up with you shortly.
                </p>

                <div style="padding-top:20px;border-top:1px solid #dad3c2;">
                  <div style="color:#5b6472;font-size:13px;margin-bottom:4px;">For your records</div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Inquiry", inquiry)}
                    ${row("Company", input.company)}
                    ${row("Email", input.email)}
                    ${row("Phone", input.phone)}
                  </table>
                </div>

                <p style="margin:24px 0 0;color:#5b6472;font-size:13px;line-height:1.6;">
                  If any of that is wrong, or you need to add something, just reply to
                  this email and it will reach us directly.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f6f4ef;border-top:1px solid #dad3c2;color:#5b6472;font-size:12px;">
                ${escapeHtml(site.name)} · This message confirms an enquiry submitted at
                ${escapeHtml(new URL(env.siteUrl()).host)}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
