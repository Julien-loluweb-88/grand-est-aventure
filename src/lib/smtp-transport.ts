import nodemailer from "nodemailer";

/**
 * Port 465 = TLS direct (`secure: true`). Port 587 (ou 25) = STARTTLS (`secure: false`).
 * Sinon `Greeting never received` / timeouts peuvent venir d’un mauvais couple port/TLS.
 * Surcharge : `NODEMAILER_SECURE=true|false`.
 */
function smtpSecureForPort(port: number): boolean {
  const raw = process.env.NODEMAILER_SECURE?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return port === 465;
}

/** Retourne null si la config SMTP minimale est absente (pas d’envoi). */
export function getAppMailTransport(): nodemailer.Transporter | null {
  const host = process.env.NODEMAILER_HOST?.trim();
  const portRaw = process.env.NODEMAILER_PORT?.trim();
  if (!host || !portRaw) {
    return null;
  }
  const port = parseInt(portRaw, 10);
  if (Number.isNaN(port)) {
    return null;
  }
  const secure = smtpSecureForPort(port);
  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });
}
