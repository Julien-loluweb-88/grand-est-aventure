import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import { enigmaStepKey, TREASURE_STEP_KEY } from "@/lib/game/adventure-step-keys";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;

/**
 * État serveur de progression pour synchro (ex. retour online app mobile).
 * Query : `adventureId` (obligatoire). Pas de réponses / codes sensibles.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`progress:${ip}:${session.user.id}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  const adventureId = (request.nextUrl.searchParams.get("adventureId") ?? "").trim();
  if (!adventureId) {
    return NextResponse.json({ error: "Paramètre adventureId requis." }, { status: 400 });
  }

  const userId = session.user.id;

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: {
      id: true,
      status: true,
      enigmas: { select: { number: true }, orderBy: { number: "asc" } },
      treasure: { select: { id: true } },
    },
  });

  if (!adventure || adventure.status === false) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const [validations, userAdventure] = await Promise.all([
    prisma.userAdventureStepValidation.findMany({
      where: { userId, adventureId },
      select: { stepKey: true, validatedAt: true },
      orderBy: { validatedAt: "asc" },
    }),
    prisma.userAdventures.findFirst({
      where: { userId, adventureId },
      select: { success: true, giftNumber: true, updatedAt: true },
    }),
  ]);

  const validatedStepKeys = validations.map((v) => v.stepKey);
  const requiredEnigmaNumbers = adventure.enigmas.map((e) => e.number);
  const hasTreasure = adventure.treasure != null;

  const missingForFinish: string[] = [];
  for (const n of requiredEnigmaNumbers) {
    const key = enigmaStepKey(n);
    if (!validatedStepKeys.includes(key)) {
      missingForFinish.push(key);
    }
  }
  if (hasTreasure && !validatedStepKeys.includes(TREASURE_STEP_KEY)) {
    missingForFinish.push(TREASURE_STEP_KEY);
  }

  const serverReadyForSuccessFinish =
    (requiredEnigmaNumbers.length === 0 && !hasTreasure) || missingForFinish.length === 0;

  return NextResponse.json({
    adventureId,
    validatedStepKeys,
    validations: validations.map((v) => ({
      stepKey: v.stepKey,
      validatedAt: v.validatedAt.toISOString(),
    })),
    userAdventure: userAdventure
      ? {
          success: userAdventure.success,
          giftNumber: userAdventure.giftNumber,
          updatedAt: userAdventure.updatedAt.toISOString(),
        }
      : null,
    requiredEnigmaNumbers,
    hasTreasure,
    missingStepKeysForFinish: missingForFinish,
    serverReadyForSuccessFinish,
  });
}
