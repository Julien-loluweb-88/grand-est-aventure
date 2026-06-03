import "server-only";

import { UserAdventurePlaySessionStatus } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  deriveAdventurePlayerState,
  type AdventurePlayerState,
  type AdventurePlayerStateBatchInput,
} from "@/lib/game/adventure-player-state-core";

export type {
  AdventurePlayStatus,
  AdventurePlayerState,
  AdventurePlayerStateBatchInput,
  AdventureProgressShape,
} from "@/lib/game/adventure-player-state-core";

export {
  countValidatedRequiredSteps,
  deriveAdventurePlayerState,
} from "@/lib/game/adventure-player-state-core";

/** Charge l’état joueur pour plusieurs aventures en requêtes agrégées (catalogue / home). */
export async function batchLoadAdventurePlayerStateByUser(
  userId: string,
  adventures: AdventurePlayerStateBatchInput[]
): Promise<Map<string, AdventurePlayerState>> {
  const result = new Map<string, AdventurePlayerState>();
  if (adventures.length === 0) {
    return result;
  }

  const adventureIds = adventures.map((a) => a.adventureId);

  const [openSessions, validations, userAdventures] = await Promise.all([
    prisma.userAdventurePlaySession.findMany({
      where: {
        userId,
        adventureId: { in: adventureIds },
        status: UserAdventurePlaySessionStatus.IN_PROGRESS,
      },
      select: { adventureId: true },
    }),
    prisma.userAdventureStepValidation.findMany({
      where: { userId, adventureId: { in: adventureIds } },
      select: { adventureId: true, stepKey: true },
    }),
    prisma.userAdventures.findMany({
      where: { userId, adventureId: { in: adventureIds } },
      select: { adventureId: true, success: true },
    }),
  ]);

  const openSessionIds = new Set(openSessions.map((s) => s.adventureId));
  const validationsByAdventure = new Map<string, string[]>();
  for (const v of validations) {
    const list = validationsByAdventure.get(v.adventureId) ?? [];
    list.push(v.stepKey);
    validationsByAdventure.set(v.adventureId, list);
  }
  const userAdventureById = new Map(
    userAdventures.map((ua) => [ua.adventureId, ua.success] as const)
  );

  for (const adventure of adventures) {
    const validatedStepKeys = validationsByAdventure.get(adventure.adventureId) ?? [];
    const success = userAdventureById.get(adventure.adventureId);
    result.set(
      adventure.adventureId,
      deriveAdventurePlayerState({
        adventure: {
          requiredEnigmaNumbers: adventure.requiredEnigmaNumbers,
          hasTreasure: adventure.hasTreasure,
        },
        validatedStepKeys,
        hasOpenPlaySession: openSessionIds.has(adventure.adventureId),
        userAdventureSuccess: success === undefined ? null : success,
      })
    );
  }

  return result;
}

export async function loadAdventurePlayerStateForUser(
  userId: string,
  adventure: AdventurePlayerStateBatchInput
): Promise<AdventurePlayerState> {
  const map = await batchLoadAdventurePlayerStateByUser(userId, [adventure]);
  return (
    map.get(adventure.adventureId) ??
    deriveAdventurePlayerState({
      adventure: {
        requiredEnigmaNumbers: adventure.requiredEnigmaNumbers,
        hasTreasure: adventure.hasTreasure,
      },
      validatedStepKeys: [],
      hasOpenPlaySession: false,
      userAdventureSuccess: null,
    })
  );
}
