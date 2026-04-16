import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserRoleForAccess,
  userCanAccessAdventureForPlay,
} from "@/lib/adventure-public-access";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import { enigmaStepKey } from "@/lib/game/adventure-step-keys";
import { enigmaSubmissionIsCorrect } from "@/lib/game/enigma-submission-check";
import {
  getValidatedStepKeys,
  recordStepValidated,
} from "@/lib/game/server-adventure-progress";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 80;
const MAX_SUBMISSION_LEN = 500;

/**
 * Valide une réponse d’énigme côté serveur et enregistre l’étape (ordre 1…n obligatoire).
 * Corps : `{ adventureId, userId, enigmaNumber, submission }`
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
    `validate-enigma:${ip}:${session.user.id}`,
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
  const submission = typeof b.submission === "string" ? b.submission : "";
  const enigmaNumberRaw = b.enigmaNumber;

  const enigmaNumber =
    typeof enigmaNumberRaw === "number"
      ? enigmaNumberRaw
      : typeof enigmaNumberRaw === "string"
        ? parseInt(enigmaNumberRaw, 10)
        : NaN;

  if (!adventureId || !userId || !Number.isInteger(enigmaNumber) || enigmaNumber < 1) {
    return NextResponse.json(
      { error: "adventureId, userId et enigmaNumber (entier ≥ 1) requis." },
      { status: 400 }
    );
  }

  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (submission.length > MAX_SUBMISSION_LEN) {
    return NextResponse.json(
      { error: `Réponse trop longue (max ${MAX_SUBMISSION_LEN} caractères).` },
      { status: 400 }
    );
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { id: true, status: true, audience: true },
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

  const enigma = await prisma.enigma.findUnique({
    where: {
      adventureId_number: { adventureId, number: enigmaNumber },
    },
    select: {
      number: true,
      uniqueResponse: true,
      answer: true,
      choice: true,
    },
  });

  if (!enigma) {
    return NextResponse.json({ error: "Énigme introuvable." }, { status: 404 });
  }

  const stepKey = enigmaStepKey(enigmaNumber);

  const result = await prisma.$transaction(async (tx) => {
    const done = await getValidatedStepKeys(tx, userId, adventureId);
    if (done.has(stepKey)) {
      return { ok: true as const, alreadyValidated: true as const };
    }
    for (let i = 1; i < enigmaNumber; i++) {
      if (!done.has(enigmaStepKey(i))) {
        return {
          ok: false as const,
          status: 400,
          body: {
            error: `Validez d’abord l’énigme ${i}.`,
            code: "ORDER",
          },
        };
      }
    }

    if (!enigmaSubmissionIsCorrect(enigma, submission)) {
      return {
        ok: false as const,
        status: 400,
        body: { error: "Réponse incorrecte.", code: "WRONG_ANSWER" },
      };
    }

    await recordStepValidated(tx, userId, adventureId, stepKey);
    return { ok: true as const, alreadyValidated: false as const };
  });

  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    stepKey,
    ...(result.alreadyValidated ? { alreadyValidated: true } : {}),
  });
}
