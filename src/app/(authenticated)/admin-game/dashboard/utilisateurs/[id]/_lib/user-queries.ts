import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin, requireUserPermission } from "./user-admin-guard";

export async function getUserById(id: string) {
  await requireUserPermission("get");
  return auth.api.getUser({
    query: { id },
    headers: await headers(),
  });
}

export async function getAdminAdventureRights(userId: string) {
  await requireSuperadmin();

  const [allAdventures, assignedAccesses] = await Promise.all([
    prisma.adventure.findMany({
      select: { id: true, name: true, city: true },
      orderBy: [{ city: "asc" }, { name: "asc" }],
    }),
    prisma.adminAdventureAccess.findMany({
      where: { userId },
      select: { adventureId: true },
    }),
  ]);

  return {
    adventures: allAdventures,
    assignedAdventureIds: assignedAccesses.map((access) => access.adventureId),
  };
}
