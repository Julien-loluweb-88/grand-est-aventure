"use server";

import { z } from "zod";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import {
  CONTACT_EMAIL_MAX_CHARS,
  CONTACT_MESSAGE_MAX_CHARS,
  CONTACT_NAME_MAX_CHARS,
} from "@/lib/contact-text-limits";
import { buildBrandEmailHtml, escapeHtmlForBrandEmail } from "@/lib/email-brand-template";
import { getAppMailTransport } from "@/lib/smtp-transport";

const CONTACT_MAIL_TO =
  process.env.CONTACT_MAIL_TO?.trim() || "developpement@raonletape.fr";

const CONTACT_WINDOW_MS = 10 * 60_000;
const CONTACT_MAX_PER_WINDOW = 3;

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom est requis.")
    .max(CONTACT_NAME_MAX_CHARS, `Le nom ne peut pas dépasser ${CONTACT_NAME_MAX_CHARS} caractères.`),
  email: z
    .string()
    .trim()
    .email("Adresse e-mail invalide.")
    .max(CONTACT_EMAIL_MAX_CHARS, "Adresse e-mail invalide."),
  message: z
    .string()
    .trim()
    .min(10, "Le message est trop court.")
    .max(
      CONTACT_MESSAGE_MAX_CHARS,
      `Le message ne peut pas dépasser ${CONTACT_MESSAGE_MAX_CHARS} caractères.`
    ),
});

export async function contactForm(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, email, message } = parsed.data;
  const rl = checkRateLimit(
    `contact:${email.toLowerCase()}`,
    CONTACT_MAX_PER_WINDOW,
    CONTACT_WINDOW_MS
  );
  if (!rl.ok) {
    return { error: "Trop de demandes. Réessayez plus tard." };
  }

  try {
    const transporter = getAppMailTransport();
    if (!transporter) {
      return { error: "Service d'envoi indisponible." };
    }

    const text = `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const html = buildBrandEmailHtml({
      preheader: `Message de ${name} — formulaire contact`,
      headline: "Nouveau message (formulaire contact)",
      blocks: [
        {
          type: "highlight",
          title: "Coordonnées",
          text: `${name}\n${email}`,
        },
        { type: "highlight", title: "Message", text: message },
        {
          type: "html",
          html: `<p style="margin:0;font-size:13px;color:#281401;opacity:0.85;">Répondre à : <a href="mailto:${escapeHtmlForBrandEmail(email)}" style="color:#68a618;font-weight:600;">${escapeHtmlForBrandEmail(email)}</a></p>`,
        },
      ],
    });

    await transporter.sendMail({
      from: `"Contact — Balad'indice" <${process.env.NODEMAILER_USER}>`,
      to: CONTACT_MAIL_TO,
      replyTo: email,
      subject: `[Contact] Message de ${name}`,
      text,
      html,
    });

    return { success: true };
  } catch {
    return { error: "Erreur lors de l'envoi du message." };
  }
}
