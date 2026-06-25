/** Extrait l’URL Play Store même si la variable d’env est mal formée. */
export function resolvePlayStoreUrl(raw: string | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const match = trimmed.match(/https:\/\/play\.google\.com\/\S+/);
  if (match) {
    return match[0].replace(/["']+$/, "");
  }
  return trimmed;
}
