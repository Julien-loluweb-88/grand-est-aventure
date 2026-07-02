import type { Prisma } from "../../../../generated/prisma/client";

type CriteriaInput = Prisma.JsonValue | unknown;

export type MilestoneAdventuresCriteria = { minCompletedAdventures?: number };
export type MilestoneKmCriteria = { minKmTotal?: number };
export type TimeWindowCriteria = {
  startHour?: number;
  endHour?: number;
  timezone?: string;
};
export type StreakCriteria = {
  minWeeksConsecutive?: number;
  minCompletionsPerWeek?: number;
};
export type MonthlyKmCriteria = Record<string, never>;

function asObject(raw: CriteriaInput | null | undefined): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

export function parseMilestoneAdventuresCriteria(
  raw: CriteriaInput | null | undefined
): MilestoneAdventuresCriteria {
  const o = asObject(raw);
  const n = Number(o.minCompletedAdventures);
  return {
    minCompletedAdventures:
      Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined,
  };
}

export function parseMilestoneKmCriteria(raw: CriteriaInput | null | undefined): MilestoneKmCriteria {
  const o = asObject(raw);
  const n = Number(o.minKmTotal);
  return { minKmTotal: Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined };
}

export function parseTimeWindowCriteria(
  raw: CriteriaInput | null | undefined
): Required<Pick<TimeWindowCriteria, "startHour" | "endHour">> & TimeWindowCriteria {
  const o = asObject(raw);
  const start = Number(o.startHour);
  const end = Number(o.endHour);
  return {
    startHour: Number.isFinite(start) ? Math.floor(start) : 21,
    endHour: Number.isFinite(end) ? Math.floor(end) : 6,
    timezone: typeof o.timezone === "string" ? o.timezone : "Europe/Paris",
  };
}

export function parseStreakCriteria(raw: CriteriaInput | null | undefined): StreakCriteria & {
  minWeeksConsecutive: number;
} {
  const o = asObject(raw);
  const n = Number(o.minWeeksConsecutive);
  return {
    minWeeksConsecutive: Number.isFinite(n) && n > 0 ? Math.floor(n) : 4,
    minCompletionsPerWeek: 1,
  };
}
