/** Durée lisible en français (secondes → min / h). */
export function formatDurationFr(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) {
    return "—";
  }
  const s = Math.round(seconds);
  if (s < 90) {
    return `${s} s`;
  }
  const minutes = Math.round(s / 60);
  if (minutes < 120) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const rm = minutes % 60;
  return rm > 0 ? `${h} h ${rm} min` : `${h} h`;
}

/** Nombre entier avec séparateur de milliers (espace insécable). */
export function formatCountFr(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}
