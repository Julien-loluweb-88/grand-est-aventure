import "server-only";

import { after } from "next/server";
import { getAppMailTransport } from "@/lib/smtp-transport";

function logMailError(err: unknown) {
  console.error("[mail] envoi transactionnel:", err);
}

export type TransactionalEmailParams = {
  /** Un ou plusieurs destinataires (un envoi séparé par adresse, pas de fuite d’adresses en copie). */
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

/**
 * Envoie l’e-mail sans bloquer la réponse HTTP (recommandation Better Auth contre les fuites de timing).
 * Sous App Router, la promesse est enregistrée via `after` (équivalent pratique à `waitUntil` serverless :
 * la plateforme garde la fonction vivante jusqu’à la fin de l’envoi). Hors contexte requête (tests, scripts),
 * repli sur fire-and-forget.
 */
export function queueTransactionalEmail(params: TransactionalEmailParams): void {
  const { to, ...rest } = params;
  const recipients = Array.isArray(to) ? to : [to];
  const delivery = Promise.all(
    recipients.map((addr) => sendTransactionalEmail({ ...rest, to: addr }))
  ).catch(logMailError);
  try {
    after(delivery);
  } catch {
    void delivery;
  }
}

/** E-mail transactionnel (Nodemailer) : même transport que reset / vérification. */
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const transporter = getAppMailTransport();
  if (!transporter) {
    throw new Error(
      "SMTP non configuré (NODEMAILER_HOST / NODEMAILER_PORT). Impossible d’envoyer l’e-mail."
    );
  }
  const from = process.env.NODEMAILER_USER?.trim();
  if (!from) {
    throw new Error("NODEMAILER_USER manquant pour l’expéditeur des e-mails transactionnels.");
  }
  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    ...(params.replyTo ? { replyTo: params.replyTo } : {}),
  });
}
