import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/api/get-client-ip";
import { contactRequestSchema } from "@/lib/contact-schema";
import {
  contactRateLimitKeys,
  submitContactMessage,
} from "@/lib/submit-contact-message";

/**
 * Formulaire contact (app mobile, clients HTTP). Corps JSON : `{ name, email, message }`.
 * Notification Discord via `DISCORD_CONTACT_WEBHOOK_URL` (secret côté serveur).
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = contactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." },
      { status: 400 }
    );
  }

  const { name, email, message } = parsed.data;
  const ip = getClientIp(request);
  const result = await submitContactMessage(
    { name, email, message },
    contactRateLimitKeys(email, ip),
    "mobile"
  );

  if (!result.ok) {
    if (result.retryAfterMs != null) {
      return NextResponse.json(
        { error: result.error },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
          },
        }
      );
    }
    const status = result.error.includes("indisponible") ? 503 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, message: "Message envoyé." });
}
