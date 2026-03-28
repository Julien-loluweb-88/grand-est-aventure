/**
 * Origines autorisées pour les deep links Expo / React Native (Better Auth).
 * @see docs/expo-better-auth.md
 */

/** Schéma Expo (`app.json` → `expo.scheme`). */
const DEFAULT_EXPO_SCHEME = "grandestaventure";

function parseExtraOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Liste fusionnée avec les origines dérivées de `baseURL` par Better Auth
 * (voir `getTrustedOrigins` : l’origine du site web est ajoutée automatiquement).
 */
export function getExpoTrustedOrigins(): string[] {
  const scheme = (
    process.env.BETTER_AUTH_EXPO_SCHEME ?? DEFAULT_EXPO_SCHEME
  ).trim();
  const origins: string[] = [
    `${scheme}://`,
    `${scheme}://*`,
  ];
  origins.push(...parseExtraOrigins(process.env.BETTER_AUTH_TRUSTED_ORIGINS_EXTRA));

  if (process.env.NODE_ENV === "development") {
    origins.push(
      "exp://**",
      "exp://192.168.*.*:*/**",
    );
  }

  return [...new Set(origins)];
}
