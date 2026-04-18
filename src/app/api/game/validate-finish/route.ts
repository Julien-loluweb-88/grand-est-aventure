import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserRoleForAccess,
  userCanAccessAdventureForPlay,
} from "@/lib/adventure-public-access";
import { processGameFinish } from "@/lib/badges/award-on-finish";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import {
  GameFinishProgressError,
} from "@/lib/game/server-adventure-progress";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

/**
 * Finalise une aventure **sans trésor** : toutes les énigmes validées côté serveur.
 * Corps : `{ adventureId, userId }` — même session que `validate-enigma`.
 * Si l’aventure a un trésor, utiliser `POST /api/game/validate-treasure`.
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
    `validate-finish:${ip}:${session.user.id}`,
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
      treasure: { select: { id: true } },
      _count: { select: { enigmas: true } },
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

  if (adventure.treasure != null) {
    return NextResponse.json(
      {
        error:
          "Cette aventure comporte un trésor : finalisez avec POST /api/game/validate-treasure (code carte puis coffre).",
        code: "TREASURE_REQUIRED",
      },
      { status: 400 }
    );
  }

  if (adventure._count.enigmas === 0) {
    return NextResponse.json(
      {
        error:
          "Cette aventure n’a ni énigme ni trésor : impossible de finaliser un parcours.",
        code: "EMPTY_ADVENTURE",
      },
      { status: 400 }
    );
  }

  const alreadyDone = await prisma.userAdventures.findFirst({
    where: { userId, adventureId },
    select: { success: true },
  });
  if (alreadyDone?.success) {
    return NextResponse.json({
      ok: true,
      stepKey: "finish",
      alreadyFinished: true,
      message: "Aventure déjà terminée avec succès",
    });
  }

  try {
    const fin = await prisma.$transaction(async (tx) =>
      processGameFinish(tx, {
        adventureId,
        userId,
        success: true,
      })
    );

    return NextResponse.json({
      ok: true,
      stepKey: "finish",
      alreadyFinished: false,
      awardedUserBadgeIds: fin.awardedUserBadgeIds,
      message: "Aventure terminée avec succès",
    });
  } catch (e) {
    if (e instanceof GameFinishProgressError) {
      return NextResponse.json(
        {
          error:
            "Progression incomplète pour finaliser (toutes les énigmes doivent être validées). Consultez GET /api/game/progress?adventureId=…",
          code: e.code,
          detail: e.detail ?? null,
        },
        { status: 400 }
      );
    }
    throw e;
  }
}
