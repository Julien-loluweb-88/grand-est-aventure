import { describe, expect, it } from "vitest";
import {
  countValidatedRequiredSteps,
  deriveAdventurePlayerState,
} from "./adventure-player-state-core";
import {
  enigmaStepKey,
  TREASURE_STEP_KEY,
} from "./adventure-step-keys";

describe("deriveAdventurePlayerState", () => {
  const adventure = { requiredEnigmaNumbers: [1, 2], hasTreasure: false };

  it("NOT_STARTED sans session ni validations", () => {
    const s = deriveAdventurePlayerState({
      adventure,
      validatedStepKeys: [],
      hasOpenPlaySession: false,
      userAdventureSuccess: null,
    });
    expect(s.playStatus).toBe("NOT_STARTED");
    expect(s.hasOpenPlaySession).toBe(false);
    expect(s.hasGameplayProgress).toBe(false);
  });

  it("SESSION_OPEN avec chrono seul", () => {
    const s = deriveAdventurePlayerState({
      adventure,
      validatedStepKeys: [],
      hasOpenPlaySession: true,
      userAdventureSuccess: null,
    });
    expect(s.playStatus).toBe("SESSION_OPEN");
    expect(s.hasGameplayProgress).toBe(false);
  });

  it("IN_PROGRESS avec énigme validée", () => {
    const s = deriveAdventurePlayerState({
      adventure,
      validatedStepKeys: [enigmaStepKey(1)],
      hasOpenPlaySession: true,
      userAdventureSuccess: null,
    });
    expect(s.playStatus).toBe("IN_PROGRESS");
    expect(s.hasGameplayProgress).toBe(true);
    expect(s.validatedStepCount).toBe(1);
    expect(s.totalStepCount).toBe(2);
  });

  it("COMPLETED prioritaire sur session ouverte", () => {
    const s = deriveAdventurePlayerState({
      adventure,
      validatedStepKeys: [enigmaStepKey(1), enigmaStepKey(2)],
      hasOpenPlaySession: true,
      userAdventureSuccess: true,
    });
    expect(s.playStatus).toBe("COMPLETED");
    expect(s.hasGameplayProgress).toBe(true);
  });
});

describe("countValidatedRequiredSteps", () => {
  it("trésor : une seule étape trésor au total", () => {
    const { validatedStepCount, totalStepCount } = countValidatedRequiredSteps(
      { requiredEnigmaNumbers: [1], hasTreasure: true },
      [enigmaStepKey(1), TREASURE_STEP_KEY]
    );
    expect(totalStepCount).toBe(2);
    expect(validatedStepCount).toBe(2);
  });
});
