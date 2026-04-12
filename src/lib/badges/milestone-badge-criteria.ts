import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";

export function parseThresholdFromCriteria(
  kind: BadgeDefinitionKind,
  raw: unknown
): number {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return 1;
  const o = raw as Record<string, unknown>;
  if (kind === BadgeDefinitionKind.MILESTONE_ADVENTURES) {
    const n = Number(o.minCompletedAdventures);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  }
  const n = Number(o.minKmTotal);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}
