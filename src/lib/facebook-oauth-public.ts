/**
 * Côté client : même App ID que côté serveur (`FACEBOOK_CLIENT_ID`), en `NEXT_PUBLIC_`
 * pour afficher le bouton Facebook. Le secret reste uniquement sur le serveur.
 */
export function isFacebookSignInConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID?.trim());
}
