import { getPublicAppOrigin } from "@/lib/public-app-url";

const DEFAULT_EXPO_SCHEME = "grandestaventure";

/** Schéma Expo (`BETTER_AUTH_EXPO_SCHEME` / `app.json` → `expo.scheme`). */
export function getExpoAuthScheme(): string {
  return (process.env.BETTER_AUTH_EXPO_SCHEME ?? DEFAULT_EXPO_SCHEME).trim();
}

/**
 * Deep link pour confirmer la suppression depuis l’app mobile.
 * L’app doit écouter `supprimer-compte` et appeler `authClient.deleteUser({ token })`.
 */
export function buildDeleteAccountExpoDeepLink(token: string): string {
  const scheme = getExpoAuthScheme();
  return `${scheme}://supprimer-compte?token=${encodeURIComponent(token)}`;
}

/**
 * Page web de confirmation (token dans l’URL) — complète le lien Better Auth si besoin.
 */
export function buildDeleteAccountWebConfirmUrl(token: string): string {
  const origin = getPublicAppOrigin();
  const path = `/confirmer-suppression?deleteToken=${encodeURIComponent(token)}`;
  return origin ? `${origin}${path}` : path;
}

/** Deep link page d’adieu après suppression réussie (app Expo). */
export function buildDeleteAccountExpoFarewellDeepLink(): string {
  const scheme = getExpoAuthScheme();
  return `${scheme}://au-revoir`;
}
