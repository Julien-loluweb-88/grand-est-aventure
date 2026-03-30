import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-user";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import type { AdvertisementEventType } from "../../../../../generated/prisma/client";

const ALLOWED: AdvertisementEventType[] = ["IMPRESSION", "CLICK"];
const AD_EVENT_WINDOW_MS = 60_000;
const AD_EVENT_MAX_PER_WINDOW = 200;

/**
 * Enregistre une impression ou un clic sur une publicité (analytics).
 * Corps JSON : `{ "advertisementId": "…", "type": "IMPRESSION" | "CLICK" }`
 */
export async function POST(request: NextRequest) {
  const sessionEarly = await getSession();
  const ip = getClientIp(request);
  const rl = checkRateLimit(
    `ad-event:${ip}:${sessionEarly?.user?.id ?? "anon"}`,
    AD_EVENT_MAX_PER_WINDOW,
    AD_EVENT_WINDOW_MS
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

  const { advertisementId, type } = body as Record<string, unknown>;
  if (typeof advertisementId !== "string" || !advertisementId.trim()) {
    return NextResponse.json({ error: "advertisementId requis." }, { status: 400 });
  }
  if (typeof type !== "string" || !ALLOWED.includes(type as AdvertisementEventType)) {
    return NextResponse.json(
      { error: "type doit être IMPRESSION ou CLICK." },
      { status: 400 }
    );
  }

  const exists = await prisma.advertisement.findUnique({
    where: { id: advertisementId.trim() },
    select: { id: true, active: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Publicité introuvable." }, { status: 404 });
  }
  if (!exists.active) {
    return NextResponse.json({ error: "Publicité inactive." }, { status: 400 });
  }

  const userId = sessionEarly?.user?.id ?? null;

  await prisma.advertisementEvent.create({
    data: {
      advertisementId: exists.id,
      type: type as AdvertisementEventType,
      userId: userId ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
