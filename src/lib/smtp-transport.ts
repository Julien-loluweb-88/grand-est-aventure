import nodemailer from "nodemailer";

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
  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });
}
