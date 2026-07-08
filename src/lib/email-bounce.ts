/** Détecte les erreurs SMTP qui indiquent une adresse définitivement invalide. */
export function isPermanentEmailBounceError(message: string): boolean {
  const lower = message.toLowerCase();
  const patterns = [
    "mailbox not found",
    "user unknown",
    "recipient rejected",
    "address rejected",
    "invalid recipient",
    "does not exist",
    "unknown user",
    "no such user",
    "adresse inexistante",
    "utilisateur inconnu",
    "550 ",
    "551 ",
    "553 ",
    "550-",
    "551-",
    "553-",
    "recipient address rejected",
    "undeliverable",
  ];
  return patterns.some((pattern) => lower.includes(pattern));
}
