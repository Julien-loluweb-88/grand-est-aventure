import "server-only";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { canManageAdventure } from "@/lib/admin-access";
import { roleHasAdventurePermission } from "@/lib/permissions";

/** Données aventure (hors server actions) — évite de mélanger requêtes et `"use server"`. */
export async function getAdventureById(id: string) {
  const user = await getUser();
  if (!user) {
    return null;
  }
  if (!roleHasAdventurePermission(user.role, "read")) {
    return null;
  }
  if (
    !(await canManageAdventure({
      userId: user.id,
      role: user.role,
      adventureId: id,
    }))
  ) {
    return null;
  }

  return prisma.adventure.findUnique({
    where: { id },
    include: {
      treasure: true,
      enigmas: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          name: true,
          number: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });
}

export type AdventureAdminDetail = NonNullable<Awaited<ReturnType<typeof getAdventureById>>>;
