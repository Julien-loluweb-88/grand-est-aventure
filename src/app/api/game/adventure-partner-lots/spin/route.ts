import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserRoleForAccess,
  userCanAccessAdventureForPlay,
} from "@/lib/adventure-public-access";
import { spinOrGetExistingPartnerLotWin } from "@/lib/adventure-partner-lots/adventure-partner-lots";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

/**
 * Tire un lot partenaire pour une aventure **déjà terminée avec succès** (une fois par aventure et joueur).
 * Corps : `{ adventureId, userId }`.
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
    `adventure-partner-lots-spin:${ip}:${session.user.id}`,
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
      cityId: true,
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

  const ua = await prisma.userAdventures.findFirst({
    where: { userId, adventureId },
    select: { success: true },
  });
  if (!ua?.success) {
    return NextResponse.json(
      {
        error: "L’aventure doit être terminée avec succès avant de tourner la roue.",
        code: "ADVENTURE_NOT_FINISHED",
      },
      { status: 400 }
    );
  }

  const now = new Date();

  for (let attempt = 0; attempt < 4; attempt++) {
    const result = await prisma.$transaction((tx) =>
      spinOrGetExistingPartnerLotWin(tx, {
        userId,
        adventureId,
        cityId: adventure.cityId,
        now,
      })
    );

    if (result.kind === "existing" || result.kind === "new") {
      return NextResponse.json({
        ok: true,
        alreadyHadSpin: result.kind === "existing",
        won: result.win,
      });
    }
    if (result.kind === "no_lots") {
      return NextResponse.json(
        {
          error: "Aucun lot disponible pour cette aventure pour le moment.",
          code: "NO_PARTNER_LOTS",
        },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    {
      error: "Conflit temporaire sur le stock, réessayez.",
      code: "SPIN_RETRY",
    },
    { status: 503 }
  );
}
