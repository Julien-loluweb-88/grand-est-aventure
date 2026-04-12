import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import { claimDiscoveryPointInTransaction } from "@/lib/game/claim-discovery-point";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

/**
 * Réclame le badge d’un point de découverte (géoloc client + règles ville / aventure).
 * Corps : `{ userId, discoveryPointId, latitude, longitude }`
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(
    `claim-discovery:${ip}:${session.user.id}`,
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
  const b = body as Record<string, unknown>;
  const userId = typeof b.userId === "string" ? b.userId.trim() : "";
  const discoveryPointId =
    typeof b.discoveryPointId === "string" ? b.discoveryPointId.trim() : "";
  const latRaw = b.latitude;
  const lonRaw = b.longitude;
  const latitude = typeof latRaw === "number" ? latRaw : Number(latRaw);
  const longitude = typeof lonRaw === "number" ? lonRaw : Number(lonRaw);

  if (!userId || !discoveryPointId) {
    return NextResponse.json(
      { error: "userId et discoveryPointId requis." },
      { status: 400 }
    );
  }
  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json(
      { error: "latitude et longitude numériques requis." },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction((tx) =>
    claimDiscoveryPointInTransaction(tx, {
      userId,
      discoveryPointId,
      clientLatitude: latitude,
      clientLongitude: longitude,
    })
  );

  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND" || result.code === "INACTIVE_ADVENTURE"
        ? 404
        : result.code === "TOO_FAR" || result.code === "ADVENTURE_REQUIRED"
          ? 400
          : 500;
    return NextResponse.json({ error: result.message, code: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    userBadgeId: result.userBadgeId,
    ...(result.alreadyHad ? { alreadyHad: true } : {}),
  });
}
