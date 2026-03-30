/** Normalise une réponse joueur pour comparaison (casse, espaces, Unicode). */
export function normalizeGameSubmission(s: string): string {
  return s
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
