export function enigmaStepKey(enigmaNumber: number): string {
  return `enigma:${enigmaNumber}`;
}

/** Validation du code **dans** le trésor physique (saisie `chestCode`). */
export const TREASURE_STEP_KEY = "treasure";
