import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserRoleForAccess,
  userCanAccessAdventureForPlay,
} from "@/lib/adventure-public-access";
import { redeemPartnerLotWin } from "@/lib/adventure-partner-lots/adventure-partner-lots";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

/**
 * Le joueur confirme en boutique (souvent après accord du commerçant) : usage unique du gain.
 * Idempotent si déjà validé (`alreadyRedeemed: true`). Corps : `{ adventureId, userId }`.
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
    `adventure-partner-lots-redeem:${ip}:${session.user.id}`,
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
  const adventureId = typeof b.adventureId === "string" ? b.adventureId.trim() : "";
  const userId = typeof b.userId === "string" ? b.userId.trim() : "";

  if (!adventureId || !userId) {
    return NextResponse.json(
      { error: "adventureId et userId requis." },
      { status: 400 }
    );
  }

  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: {
      id: true,
      status: true,
      audience: true,
    },
  });

  if (!adventure || adventure.status === false) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const userRole = await getUserRoleForAccess(userId);
  const canPlay = await userCanAccessAdventureForPlay(prisma, {
    userId,
    role: userRole,
    adventure,
  });
  if (!canPlay) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const r = await redeemPartnerLotWin({ userId, adventureId });
  if (!r.ok) {
    return NextResponse.json(
      { error: r.error, code: r.code },
      { status: r.status }
    );
  }

  return NextResponse.json({
    ok: true,
    redeemedAt: r.redeemedAt,
    alreadyRedeemed: r.alreadyRedeemed,
  });
}
