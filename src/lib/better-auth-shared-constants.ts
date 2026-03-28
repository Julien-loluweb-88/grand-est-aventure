/**
 * Constantes partagées entre `auth.ts`, le bridge admin Prisma et la doc Better Auth
 * ([email-password](https://better-auth.com/docs/authentication/email-password),
 * [admin](https://better-auth.com/docs/plugins/admin)).
 * Modifier ici pour garder un seul endroit à jour.
 */
export const DEFAULT_ADMIN_BAN_REASON = "Comportement abusif (spam).";

/** Aligné sur les défauts Better Auth pour e-mail / mot de passe. */
export const DEFAULT_MIN_PASSWORD_LENGTH = 8;
export const DEFAULT_MAX_PASSWORD_LENGTH = 128;

/** Durée du lien « mot de passe oublié » (secondes). */
export const RESET_PASSWORD_TOKEN_EXPIRES_IN_SEC = 60 * 60 * 24;
