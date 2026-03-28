/**
 * Côté client : même Application ID que côté serveur (`DISCORD_CLIENT_ID`), en `NEXT_PUBLIC_`
 * pour afficher le bouton Discord. Le secret reste uniquement sur le serveur.
 */
export function isDiscordSignInConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID?.trim());
}
