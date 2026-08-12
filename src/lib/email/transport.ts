import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { env } from "@/lib/env";

/**
 * Shared Gmail SMTP transport.
 *
 * Unlike an HTTP mail API, SMTP pays for a TCP + TLS + AUTH handshake on every
 * connection, so the transporter is cached at module scope and pooled: a warm
 * serverless instance handling several enquiries reuses the same socket.
 *
 * Gmail requires an App Password (with 2FA enabled on the account) — a normal
 * account password is rejected. Its relay also caps sending at a few hundred
 * messages a day, which is fine for enquiry volume but not for bulk mail.
 */
let transporter: Transporter | null = null;

export function getTransport(): Transporter {
  if (transporter) return transporter;

  const port = env.smtpPort();

  transporter = nodemailer.createTransport({
    host: env.smtpHost(),
    port,
    // 465 speaks TLS from the first byte; 587 upgrades via STARTTLS.
    secure: port === 465,
    auth: {
      user: env.smtpUser(),
      pass: env.smtpPassword(),
    },
    pool: true,
    maxConnections: 1,
  });

  return transporter;
}
