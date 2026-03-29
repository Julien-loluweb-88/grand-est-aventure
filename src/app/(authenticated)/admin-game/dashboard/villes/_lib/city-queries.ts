import "server-only";

import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { getManagedAdventureIds, isSuperadmin } from "@/lib/admin-access";

export async function listCitiesForAdminTable() {
  const actor = await getAdminActorForAuthorization();

  const managedIds =
    !actor || isSuperadmin(actor.role)
      ? null
      : await getManagedAdventureIds(actor.id);

  const adventureCountSelect =
    managedIds === null
      ? true
      : ({ where: { id: { in: managedIds } } } as const);

  return prisma.city.findMany({
    select: {
      id: true,
      name: true,
      inseeCode: true,
      _count: { select: { adventures: adventureCountSelect } },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export async function getCityByIdForAdmin(id: string) {
  return prisma.city.findUnique({
    where: { id },
  });
}
