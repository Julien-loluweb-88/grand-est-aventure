import { z } from "zod";
import {
  CONTACT_EMAIL_MAX_CHARS,
  CONTACT_MESSAGE_MAX_CHARS,
  CONTACT_NAME_MAX_CHARS,
  CONTACT_PHONE_MAX_CHARS,
} from "@/lib/contact-text-limits";

export const contactRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom est requis.")
    .max(
      CONTACT_NAME_MAX_CHARS,
      `Le nom ne peut pas dépasser ${CONTACT_NAME_MAX_CHARS} caractères.`
    ),
  email: z
    .string()
    .trim()
    .email("Adresse e-mail invalide.")
    .max(CONTACT_EMAIL_MAX_CHARS, "Adresse e-mail invalide."),
  phone: z.preprocess(
    (val) => (val == null ? "" : val),
    z
      .string()
      .trim()
      .max(
        CONTACT_PHONE_MAX_CHARS,
        `Le numéro ne peut pas dépasser ${CONTACT_PHONE_MAX_CHARS} caractères.`
      )
      .transform((v) => (v.length > 0 ? v : undefined))
  ),
  message: z
    .string()
    .trim()
    .min(10, "Le message est trop court.")
    .max(
      CONTACT_MESSAGE_MAX_CHARS,
      `Le message ne peut pas dépasser ${CONTACT_MESSAGE_MAX_CHARS} caractères.`
    ),
});

export type ContactRequest = z.infer<typeof contactRequestSchema>;
