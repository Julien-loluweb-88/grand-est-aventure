/**
 * Origine publique de l’app (sans slash final).
 * Définir `NEXT_PUBLIC_BETTER_AUTH_URL` dans `.env` (ex. `http://localhost:3000` en local).
 */
export function getPublicAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim() ?? "";
  return raw.replace(/\/$/, "");
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
 * Doit être une origine autorisée : utiliser une URL absolue si `NEXT_PUBLIC_BETTER_AUTH_URL` est défini.
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
