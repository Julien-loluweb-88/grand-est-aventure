"use server";

import { headers } from "next/headers";
import { getClientIpFromHeaders } from "@/lib/api/get-client-ip";
import { contactRequestSchema } from "@/lib/contact-schema";
import {
  contactRateLimitKeys,
  submitContactMessage,
} from "@/lib/submit-contact-message";

export async function contactForm(formData: FormData) {
  const parsed = contactRequestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, email, message } = parsed.data;
  const ip = getClientIpFromHeaders(await headers());
  const result = await submitContactMessage(
    { name, email, message },
    contactRateLimitKeys(email, ip),
    "web"
  );

  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true };
}
