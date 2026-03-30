import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import { enigmaStepKey, TREASURE_STEP_KEY } from "@/lib/game/adventure-step-keys";
import { normalizeGameSubmission } from "@/lib/game/normalize-game-submission";
import {
  getValidatedStepKeys,
  recordStepValidated,
} from "@/lib/game/server-adventure-progress";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const MAX_CODE_LEN = 120;

function treasureCodesMatch(
  code: string,
  safeCode: string | null,
  submissionRaw: string
): boolean {
  const sub = normalizeGameSubmission(submissionRaw);
  if (!sub) return false;
  if (normalizeGameSubmission(code) === sub) return true;
  if (safeCode != null && safeCode.trim() !== "") {
    if (normalizeGameSubmission(safeCode) === sub) return true;
  }
  return false;
}

/**
 * Valide le code trésor côté serveur (après toutes les énigmes).
 * Corps : `{ adventureId, userId, code }`
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
    `validate-treasure:${ip}:${session.user.id}`,
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
  const code = typeof b.code === "string" ? b.code : "";

  if (!adventureId || !userId) {
    return NextResponse.json(
      { error: "adventureId et userId requis." },
      { status: 400 }
    );
  }

  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (code.length > MAX_CODE_LEN) {
    return NextResponse.json({ error: "Code trop long." }, { status: 400 });
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: {
      id: true,
      status: true,
      treasure: { select: { code: true, safeCode: true } },
      enigmas: { select: { number: true }, orderBy: { number: "asc" } },
    },
  });

  if (!adventure || adventure.status === false) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const treasureRow = adventure.treasure;
  if (!treasureRow) {
    return NextResponse.json(
      { error: "Cette aventure n’a pas de trésor." },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const done = await getValidatedStepKeys(tx, userId, adventureId);

    if (done.has(TREASURE_STEP_KEY)) {
      return { ok: true as const, alreadyValidated: true as const };
    }

    for (const { number: n } of adventure.enigmas) {
      if (!done.has(enigmaStepKey(n))) {
        return {
          ok: false as const,
          status: 400,
          body: {
            error: "Validez toutes les énigmes avant le trésor.",
            code: "ENIGMAS_INCOMPLETE",
          },
        };
      }
    }

    if (!treasureCodesMatch(treasureRow.code, treasureRow.safeCode, code)) {
      return {
        ok: false as const,
        status: 400,
        body: { error: "Code incorrect.", code: "WRONG_CODE" },
      };
    }

    await recordStepValidated(tx, userId, adventureId, TREASURE_STEP_KEY);
    return { ok: true as const, alreadyValidated: false as const };
  });

  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    stepKey: TREASURE_STEP_KEY,
    ...(result.alreadyValidated ? { alreadyValidated: true } : {}),
  });
}
