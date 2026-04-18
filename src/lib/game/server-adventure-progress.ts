import type { Prisma } from "../../../generated/prisma/client";
import {
  enigmaStepKey,
  TREASURE_MAP_STEP_KEY,
  TREASURE_STEP_KEY,
} from "./adventure-step-keys";
import { ensureActivePlaySession } from "./user-adventure-play-session";

type Tx = Prisma.TransactionClient;

export class GameFinishProgressError extends Error {
  constructor(
    public readonly code: "INCOMPLETE_SERVER_PROGRESS",
    public readonly detail?: string
  ) {
    super("INCOMPLETE_SERVER_PROGRESS");
    this.name = "GameFinishProgressError";
  }
}

export async function getValidatedStepKeys(
  tx: Tx,
  userId: string,
  adventureId: string
): Promise<Set<string>> {
  const rows = await tx.userAdventureStepValidation.findMany({
    where: { userId, adventureId },
    select: { stepKey: true },
  });
  return new Set(rows.map((r) => r.stepKey));
}

/**
 * Lève si `success: true` n’est pas autorisé : toutes les énigmes + trésor si présent doivent être validées côté serveur.
 */
export async function assertCanFinishWithSuccess(
  tx: Tx,
  userId: string,
  adventureId: string
): Promise<void> {
  const adventure = await tx.adventure.findUnique({
    where: { id: adventureId },
    select: {
      id: true,
      enigmas: { select: { number: true }, orderBy: { number: "asc" } },
      treasure: { select: { id: true } },
    },
  });

  if (!adventure) {
    throw new GameFinishProgressError("INCOMPLETE_SERVER_PROGRESS", "adventure_not_found");
  }

  const enigmaNumbers = adventure.enigmas.map((e) => e.number);
  const hasTreasure = adventure.treasure != null;

  if (enigmaNumbers.length === 0 && !hasTreasure) {
    return;
  }

  const done = await getValidatedStepKeys(tx, userId, adventureId);

  for (const n of enigmaNumbers) {
    const key = enigmaStepKey(n);
    if (!done.has(key)) {
      throw new GameFinishProgressError("INCOMPLETE_SERVER_PROGRESS", key);
    }
  }

  if (!hasTreasure) {
    return;
  }

  const legacyTreasureOnly =
    done.has(TREASURE_STEP_KEY) && !done.has(TREASURE_MAP_STEP_KEY);
  if (legacyTreasureOnly) {
    return;
  }

  if (!done.has(TREASURE_MAP_STEP_KEY)) {
    throw new GameFinishProgressError(
      "INCOMPLETE_SERVER_PROGRESS",
      TREASURE_MAP_STEP_KEY
    );
  }
  if (!done.has(TREASURE_STEP_KEY)) {
    throw new GameFinishProgressError(
      "INCOMPLETE_SERVER_PROGRESS",
      TREASURE_STEP_KEY
    );
  }
}

export async function recordStepValidated(
  tx: Tx,
  userId: string,
  adventureId: string,
  stepKey: string
): Promise<void> {
  await tx.userAdventureStepValidation.upsert({
    where: {
      userId_adventureId_stepKey: {
        userId,
        adventureId,
        stepKey,
      },
    },
    create: { userId, adventureId, stepKey },
    update: {},
  });
  await ensureActivePlaySession(tx, userId, adventureId);
}
