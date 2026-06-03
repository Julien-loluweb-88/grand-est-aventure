import {
  enigmaStepKey,
  TREASURE_MAP_STEP_KEY,
  TREASURE_STEP_KEY,
} from "@/lib/game/adventure-step-keys";

export type AdventurePlayStatus =
  | "NOT_STARTED"
  | "SESSION_OPEN"
  | "IN_PROGRESS"
  | "COMPLETED";

export type AdventurePlayerState = {
  hasOpenPlaySession: boolean;
  hasGameplayProgress: boolean;
  playStatus: AdventurePlayStatus;
  validatedStepCount: number;
  totalStepCount: number;
};

export type AdventureProgressShape = {
  requiredEnigmaNumbers: number[];
  hasTreasure: boolean;
};

function usesLegacyTreasureOnly(validated: Set<string>): boolean {
  return validated.has(TREASURE_STEP_KEY) && !validated.has(TREASURE_MAP_STEP_KEY);
}

export function countValidatedRequiredSteps(
  input: AdventureProgressShape,
  validatedStepKeys: Iterable<string>
): { validatedStepCount: number; totalStepCount: number } {
  const validated = new Set(validatedStepKeys);
  const legacyTreasureOnly = input.hasTreasure && usesLegacyTreasureOnly(validated);

  let total = input.requiredEnigmaNumbers.length;
  let validatedCount = 0;

  for (const n of input.requiredEnigmaNumbers) {
    if (validated.has(enigmaStepKey(n))) {
      validatedCount += 1;
    }
  }

  if (input.hasTreasure) {
    if (legacyTreasureOnly) {
      total += 1;
      if (validated.has(TREASURE_STEP_KEY)) {
        validatedCount += 1;
      }
    } else {
      total += 2;
      if (validated.has(TREASURE_MAP_STEP_KEY)) {
        validatedCount += 1;
      }
      if (validated.has(TREASURE_STEP_KEY)) {
        validatedCount += 1;
      }
    }
  }

  return { validatedStepCount: validatedCount, totalStepCount: total };
}

export function deriveAdventurePlayerState(input: {
  adventure: AdventureProgressShape;
  validatedStepKeys: string[];
  hasOpenPlaySession: boolean;
  userAdventureSuccess: boolean | null;
}): AdventurePlayerState {
  const hasValidatedSteps = input.validatedStepKeys.length > 0;
  const hasUserAdventure = input.userAdventureSuccess !== null;
  const hasGameplayProgress = hasValidatedSteps || hasUserAdventure;

  const { validatedStepCount, totalStepCount } = countValidatedRequiredSteps(
    input.adventure,
    input.validatedStepKeys
  );

  const isCompleted = input.userAdventureSuccess === true;

  let playStatus: AdventurePlayStatus;
  if (isCompleted) {
    playStatus = "COMPLETED";
  } else if (hasValidatedSteps) {
    playStatus = "IN_PROGRESS";
  } else if (input.hasOpenPlaySession) {
    playStatus = "SESSION_OPEN";
  } else {
    playStatus = "NOT_STARTED";
  }

  return {
    hasOpenPlaySession: input.hasOpenPlaySession,
    hasGameplayProgress,
    playStatus,
    validatedStepCount,
    totalStepCount,
  };
}

export type AdventurePlayerStateBatchInput = AdventureProgressShape & { adventureId: string };
