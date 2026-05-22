/**
 * Origine publique HTTPS/HTTP de l’app (sans slash final).
 * Priorité : `NEXT_PUBLIC_APP_URL`, puis `NEXT_PUBLIC_BETTER_AUTH_URL` (legacy).
 */
function resolvePublicAppOriginFromEnv(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim() ??
    "";
  return raw.replace(/\/$/, "");
}

/**
 * `baseURL` Better Auth côté serveur (callbacks OAuth, liens e-mail).
 * Priorité : `BETTER_AUTH_URL`, puis origine publique ci-dessus.
 */
export function getBetterAuthServerBaseUrl(): string {
  const explicit = process.env.BETTER_AUTH_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  return resolvePublicAppOriginFromEnv();
}

export function getPublicAppOrigin(): string {
  return resolvePublicAppOriginFromEnv();
}

/** URL absolue pour le lien « mot de passe oublié » (e-mail). */
export function getResetPasswordRedirectUrl(): string {
  const origin = getPublicAppOrigin();
  const path = "/reset-password";
  if (!origin) {
    return path;
  }
  return `${origin}${path}`;
}

/**
 * URL de retour après clic sur le lien de vérification (param `callbackURL` Better Auth).
 * Doit être une origine autorisée : utiliser une URL absolue si l’origine publique est définie.
 */
export function getEmailVerificationCallbackUrl(): string {
  const origin = getPublicAppOrigin();
  const path = "/admin-game?verified=1";
  if (!origin) {
    return path;
  }
  return `${origin}${path}`;
}

/** Après confirmation du lien « changement d’e-mail » (Better Auth `changeEmail`). */
export function getChangeEmailCallbackUrl(): string {
  const origin = getPublicAppOrigin();
  const path = "/admin-game/dashboard/parametres#email";
  if (!origin) {
    return path;
  }
  return `${origin}${path}`;
}

/** Page d’adieu après suppression réussie (web + `callbackURL` Better Auth). */
export function getFarewellPagePath(): string {
  return "/au-revoir";
}

/** URL absolue de la page d’adieu. */
export function getDeleteAccountCallbackUrl(): string {
  const origin = getPublicAppOrigin();
  const path = getFarewellPagePath();
  if (!origin) {
    return path;
  }
  return `${origin}${path}`;
}
