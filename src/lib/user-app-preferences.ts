import { z } from "zod";

export const THEME_MODES = ["light", "dark", "system"] as const;
export const MAP_STYLES = ["standard", "satellite"] as const;
export const LOCALES = ["fr", "en"] as const;
export const AR_QUALITIES = ["low", "high"] as const;

/** Teinte d’accent stockée en base (entier 0–360). */
export const ACCENT_HUE_MIN = 0;
export const ACCENT_HUE_MAX = 360;

/**
 * Échelle côté app mobile (roue personnalisée, pas le HSL CSS standard) :
 * `0` = jaune, `60` = rouge, puis les autres teintes le long du cercle.
 */
export const DEFAULT_ACCENT_HUE = 0;

export type ThemeMode = (typeof THEME_MODES)[number];
export type MapStyle = (typeof MAP_STYLES)[number];
export type AppLocale = (typeof LOCALES)[number];
export type ArQuality = (typeof AR_QUALITIES)[number];

export type UserAppPreferences = {
  theme: ThemeMode;
  accentHue: number;
  locale: AppLocale;
  haptics: boolean;
  soundEffects: boolean;
  mapStyle: MapStyle;
  reduceMotion: boolean;
  showMapCompass: boolean;
  gpsHighAccuracy: boolean;
  downloadModelsOnWifiOnly: boolean;
  arQuality: ArQuality;
  fontScale: number;
};

export const DEFAULT_USER_APP_PREFERENCES: UserAppPreferences = {
  theme: "system",
  accentHue: DEFAULT_ACCENT_HUE,
  locale: "fr",
  haptics: true,
  soundEffects: true,
  mapStyle: "standard",
  reduceMotion: false,
  showMapCompass: true,
  gpsHighAccuracy: true,
  downloadModelsOnWifiOnly: true,
  arQuality: "high",
  fontScale: 1,
};

const accentHueSchema = z
  .number()
  .int("accentHue doit être un entier.")
  .min(ACCENT_HUE_MIN)
  .max(ACCENT_HUE_MAX);

const userAppPreferencesShape = {
  theme: z.enum(THEME_MODES),
  accentHue: accentHueSchema,
  locale: z.enum(LOCALES),
  haptics: z.boolean(),
  soundEffects: z.boolean(),
  mapStyle: z.enum(MAP_STYLES),
  reduceMotion: z.boolean(),
  showMapCompass: z.boolean(),
  gpsHighAccuracy: z.boolean(),
  downloadModelsOnWifiOnly: z.boolean(),
  arQuality: z.enum(AR_QUALITIES),
  fontScale: z.number().min(0.85).max(1.35),
} satisfies Record<keyof UserAppPreferences, z.ZodType>;

export const userAppPreferencesSchema = z.object(userAppPreferencesShape);

export const userAppPreferencesPatchSchema = z
  .object(userAppPreferencesShape)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Au moins une préférence est requise.",
  });

const PREFERENCE_KEYS = Object.keys(userAppPreferencesShape) as (keyof UserAppPreferences)[];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function applyStoredPreference<K extends keyof UserAppPreferences>(
  target: UserAppPreferences,
  key: K,
  raw: unknown
): void {
  const parsed = userAppPreferencesShape[key].safeParse(raw);
  if (parsed.success) {
    target[key] = parsed.data as UserAppPreferences[K];
  }
}

/** Fusionne la valeur stockée (éventuellement partielle ou invalide) avec les défauts. */
export function resolveUserAppPreferences(stored: unknown): UserAppPreferences {
  const resolved: UserAppPreferences = { ...DEFAULT_USER_APP_PREFERENCES };
  if (!isPlainObject(stored)) {
    return resolved;
  }

  for (const key of PREFERENCE_KEYS) {
    if (!(key in stored)) continue;
    applyStoredPreference(resolved, key, stored[key]);
  }

  return resolved;
}

export function mergeUserAppPreferences(
  current: UserAppPreferences,
  patch: Partial<UserAppPreferences>
): UserAppPreferences {
  return { ...current, ...patch };
}
