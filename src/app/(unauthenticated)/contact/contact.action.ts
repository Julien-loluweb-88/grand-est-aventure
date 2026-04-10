"use server";

import { z } from "zod";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import { getAppMailTransport } from "@/lib/smtp-transport";

const CONTACT_WINDOW_MS = 10 * 60_000;
const CONTACT_MAX_PER_WINDOW = 3;

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom est requis.")
    .max(120, "Le nom est trop long."),
  email: z
    .string()
    .trim()
    .email("Adresse e-mail invalide.")
    .max(254, "Adresse e-mail invalide."),
  message: z
    .string()
    .trim()
    .min(10, "Le message est trop court.")
    .max(4000, "Le message est trop long."),
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

    await transporter.sendMail({
      from: `"Contact Form" <${process.env.NODEMAILER_USER}>`,
      to: "developpement@raonletape.fr",
      replyTo: email,
      subject: `Nouveau message de ${name}`,
      text: `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return { success: true };
  } catch {
    return { error: "Erreur lors de l'envoi du message." };
  }
}
