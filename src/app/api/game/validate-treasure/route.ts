import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processGameFinish } from "@/lib/badges/award-on-finish";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import {
  enigmaStepKey,
  TREASURE_MAP_STEP_KEY,
  TREASURE_STEP_KEY,
} from "@/lib/game/adventure-step-keys";
import { normalizeGameSubmission } from "@/lib/game/normalize-game-submission";
import {
  GameFinishProgressError,
  getValidatedStepKeys,
  recordStepValidated,
} from "@/lib/game/server-adventure-progress";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const MAX_CODE_LEN = 120;

function codesMatch(
  primary: string,
  alternate: string | null | undefined,
  submissionRaw: string
): boolean {
  const sub = normalizeGameSubmission(submissionRaw);
  if (!sub) return false;
  if (normalizeGameSubmission(primary) === sub) return true;
  if (alternate != null && alternate.trim() !== "") {
    if (normalizeGameSubmission(alternate) === sub) return true;
  }
  return false;
}

function parsePhase(raw: unknown): "map" | "chest" | undefined {
  if (raw === "map" || raw === "chest") return raw;
  return undefined;
}

function parseOptionalGiftNumber(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
}

/**
 * Valide le trésor : révélation carte (`treasure:map`), puis code coffre (`treasure`).
 * À l’étape **coffre**, le corps peut inclure `giftNumber` (nombre indiqué par le joueur) : enregistrement `UserAdventures`,
 * badges via `processGameFinish`.
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
  const explicitPhase = parsePhase(b.phase);

  if (b.giftNumber !== undefined && b.giftNumber !== null) {
    const g = parseOptionalGiftNumber(b.giftNumber);
    if (g === undefined) {
      return NextResponse.json(
        { error: "giftNumber doit être un entier ≥ 0." },
        { status: 400 }
      );
    }
  }

  const clientGiftNumber = parseOptionalGiftNumber(b.giftNumber);

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
      treasure: {
        select: {
          mapRevealCode: true,
          mapRevealCodeAlt: true,
          chestCode: true,
          chestCodeAlt: true,
        },
      },
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

  try {
    const result = await prisma.$transaction(async (tx) => {
      const done = await getValidatedStepKeys(tx, userId, adventureId);

      const legacyComplete =
        done.has(TREASURE_STEP_KEY) && !done.has(TREASURE_MAP_STEP_KEY);
      if (legacyComplete) {
        const existingUa = await tx.userAdventures.findFirst({
          where: { userId, adventureId },
        });
        if (!existingUa?.success) {
          const fin = await processGameFinish(tx, {
            adventureId,
            userId,
            success: true,
            clientGiftNumber,
          });
          return {
            ok: true as const,
            alreadyValidated: false as const,
            stepKey: TREASURE_STEP_KEY,
            awardedUserBadgeIds: fin.awardedUserBadgeIds,
            message: "Aventure terminée avec succès",
          };
        }
        return {
          ok: true as const,
          alreadyValidated: true as const,
          stepKey: TREASURE_STEP_KEY,
        };
      }

      if (done.has(TREASURE_MAP_STEP_KEY) && done.has(TREASURE_STEP_KEY)) {
        return {
          ok: true as const,
          alreadyValidated: true as const,
          stepKey: TREASURE_STEP_KEY,
        };
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

      const mapDone = done.has(TREASURE_MAP_STEP_KEY);

      const inferredPhase: "map" | "chest" = !mapDone ? "map" : "chest";
      const effectivePhase = explicitPhase ?? inferredPhase;

      if (explicitPhase === "chest" && !mapDone) {
        return {
          ok: false as const,
          status: 400,
          body: {
            error: "Révélez d’abord le trésor sur la carte (code de fin d’énigme).",
            code: "MAP_REVEAL_REQUIRED",
          },
        };
      }

      if (explicitPhase === "map" && mapDone) {
        return {
          ok: false as const,
          status: 400,
          body: {
            error: "Le trésor est déjà révélé sur la carte.",
            code: "MAP_ALREADY_REVEALED",
          },
        };
      }

      if (effectivePhase === "map") {
        if (
          !codesMatch(
            treasureRow.mapRevealCode,
            treasureRow.mapRevealCodeAlt,
            code
          )
        ) {
          return {
            ok: false as const,
            status: 400,
            body: { error: "Code incorrect.", code: "WRONG_CODE" },
          };
        }
        await recordStepValidated(tx, userId, adventureId, TREASURE_MAP_STEP_KEY);
        return {
          ok: true as const,
          alreadyValidated: false as const,
          stepKey: TREASURE_MAP_STEP_KEY,
        };
      }

      if (!codesMatch(treasureRow.chestCode, treasureRow.chestCodeAlt, code)) {
        return {
          ok: false as const,
          status: 400,
          body: { error: "Code incorrect.", code: "WRONG_CODE" },
        };
      }

      await recordStepValidated(tx, userId, adventureId, TREASURE_STEP_KEY);
      const fin = await processGameFinish(tx, {
        adventureId,
        userId,
        success: true,
        clientGiftNumber,
      });
      return {
        ok: true as const,
        alreadyValidated: false as const,
        stepKey: TREASURE_STEP_KEY,
        awardedUserBadgeIds: fin.awardedUserBadgeIds,
        message: "Aventure terminée avec succès",
      };
    });

    if (!result.ok) {
      return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      stepKey: result.stepKey,
      ...(result.alreadyValidated ? { alreadyValidated: true } : {}),
      ...("awardedUserBadgeIds" in result && result.awardedUserBadgeIds
        ? {
            awardedUserBadgeIds: result.awardedUserBadgeIds,
            message: result.message,
          }
        : {}),
    });
  } catch (e) {
    if (e instanceof GameFinishProgressError) {
      return NextResponse.json(
        {
          error:
            "Progression incomplète pour finaliser (énigmes / étapes trésor). Consultez GET /api/game/progress?adventureId=…",
          code: e.code,
          detail: e.detail ?? null,
        },
        { status: 400 }
      );
    }
    throw e;
  }
}
