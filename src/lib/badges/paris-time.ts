import "server-only";

const PARIS_TZ = "Europe/Paris";

/** Heure locale (0–23) et date calendaire à Paris. */
export function getParisDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
  };
}

/** Clé `YYYY-MM` pour un instant, mois calendaire à Paris. */
export function getParisYearMonth(date: Date): string {
  const { year, month } = getParisDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Lundi 00:00 Paris de la semaine contenant `date` → clé ISO `YYYY-MM-DD`. */
export function getParisWeekKey(date: Date): string {
  const { year, month, day } = getParisDateParts(date);
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_TZ,
    weekday: "short",
  }).format(utcNoon);
  const dayIndex: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const mondayOffset = dayIndex[weekday] ?? 0;
  const monday = new Date(utcNoon);
  monday.setUTCDate(utcNoon.getUTCDate() - mondayOffset);
  const m = getParisDateParts(monday);
  return `${m.year}-${String(m.month).padStart(2, "0")}-${String(m.day).padStart(2, "0")}`;
}

/** `true` si l’heure à Paris est dans [startHour, 24) ∪ [0, endHour). */
export function isInParisHourWindow(
  date: Date,
  startHour: number,
  endHour: number
): boolean {
  const { hour } = getParisDateParts(date);
  if (startHour > endHour) {
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
}
