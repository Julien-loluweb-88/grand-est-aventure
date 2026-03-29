import "server-only";

import { prisma } from "@/lib/prisma";
import type { CitySelectOption } from "@/lib/city-types";

/** Liste ordonnée pour selects (création / édition d’aventure). */
export async function listCitiesForAdventureSelect(): Promise<CitySelectOption[]> {
  return prisma.city.findMany({
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}
