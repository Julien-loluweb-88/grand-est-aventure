/**
 * Côté client : même identifiant OAuth que côté serveur (`GOOGLE_CLIENT_ID`), en `NEXT_PUBLIC_`
 * pour afficher le bouton Google. Les secrets restent uniquement sur le serveur.
 */
export function isGoogleSignInConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim());
}
