export function enigmaStepKey(enigmaNumber: number): string {
  return `enigma:${enigmaNumber}`;
}

/** Révélation du marqueur trésor sur la carte (saisie `mapRevealCode`). */
export const TREASURE_MAP_STEP_KEY = "treasure:map";

/** Validation du code **dans** le trésor physique (saisie `chestCode`). Anciennes parties : seule cette clé peut exister (sans `treasure:map`). */
export const TREASURE_STEP_KEY = "treasure";
