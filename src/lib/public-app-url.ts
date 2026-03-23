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
