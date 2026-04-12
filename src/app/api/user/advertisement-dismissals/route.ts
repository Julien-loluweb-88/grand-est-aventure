import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-user";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

/**
 * Enregistre le masquage d’une publicité pour le joueur connecté (idempotent).
 * Corps JSON : `{ "advertisementId": "…" }`
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(
    `ad-dismiss:${ip}:${session.user.id}`,
    MAX_PER_WINDOW,
    WINDOW_MS
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  const advertisementId = String(
    (body as Record<string, unknown>).advertisementId ?? ""
  ).trim();
  if (!advertisementId) {
    return NextResponse.json({ error: "advertisementId requis." }, { status: 400 });
  }

  const exists = await prisma.advertisement.findUnique({
    where: { id: advertisementId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Publicité introuvable." }, { status: 404 });
  }

  await prisma.userAdvertisementDismissal.upsert({
    where: {
      userId_advertisementId: {
        userId: session.user.id,
        advertisementId,
      },
    },
    create: { userId: session.user.id, advertisementId },
    update: {},
  });

  return NextResponse.json({ ok: true as const });
}
