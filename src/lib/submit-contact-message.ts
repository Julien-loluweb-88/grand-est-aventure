import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import type { ContactRequest } from "@/lib/contact-schema";
import {
  type ContactSource,
  sendContactDiscordWebhook,
} from "@/lib/send-contact-discord-webhook";

export const CONTACT_WINDOW_MS = 10 * 60_000;
export const CONTACT_MAX_PER_WINDOW = 3;

export type SubmitContactResult =
  | { ok: true }
  | { ok: false; error: string; retryAfterMs?: number };

/**
 * Rate limit + notification Discord pour les formulaires contact (web, API mobile).
 */
export async function submitContactMessage(
  data: ContactRequest,
  rateLimitKeys: string[],
  source: ContactSource
): Promise<SubmitContactResult> {
  for (const key of rateLimitKeys) {
    const rl = checkRateLimit(key, CONTACT_MAX_PER_WINDOW, CONTACT_WINDOW_MS);
    if (!rl.ok) {
      return {
        ok: false,
        error: "Trop de demandes. Réessayez plus tard.",
        retryAfterMs: rl.retryAfterMs,
      };
    }
  }

  const sent = await sendContactDiscordWebhook({ ...data, source });
  if (!sent.ok) {
    return { ok: false, error: sent.error };
  }

  return { ok: true };
}

/** Clés de rate limit partagées web + API (e-mail + IP). */
export function contactRateLimitKeys(email: string, ip: string): string[] {
  return [`contact:${email.toLowerCase()}`, `contact-ip:${ip}`];
}
