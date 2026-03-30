import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processGameFinish } from "@/lib/badges/award-on-finish";
import { GameFinishProgressError } from "@/lib/game/server-adventure-progress";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`finish:${ip}:${session.user.id}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
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

  const { adventureId, userId, success, giftNumber } = body as {
    adventureId?: string;
    userId?: string;
    success?: boolean;
    giftNumber?: number;
  };

  if (!adventureId || !userId || typeof success !== "boolean") {
    return NextResponse.json(
      { error: "Paramètres invalides (adventureId, userId, success requis)." },
      { status: 400 }
    );
  }

  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { id: true },
  });
  if (!adventure) {
    return NextResponse.json({ error: "Aventure introuvable." }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction((tx) =>
      processGameFinish(tx, {
        adventureId,
        userId,
        success,
        clientGiftNumber:
          typeof giftNumber === "number" && !Number.isNaN(giftNumber)
            ? giftNumber
            : undefined,
      })
    );

    return NextResponse.json({
      message: "Aventure terminée avec succès",
      awardedUserBadgeIds: result.awardedUserBadgeIds,
    });
  } catch (e) {
    if (e instanceof GameFinishProgressError) {
      return NextResponse.json(
        {
          error:
            "Progression serveur incomplète : validez chaque énigme puis le trésor (routes /api/game/validate-enigma et /api/game/validate-treasure). État : GET /api/game/progress?adventureId=…",
          code: e.code,
          detail: e.detail ?? null,
        },
        { status: 400 }
      );
    }
    throw e;
  }
}
