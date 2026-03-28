import "server-only";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { isSuperadmin } from "@/lib/admin-access";

export type AdminScopePickerUser = {
  id: string;
  name: string | null;
  email: string;
};

/** Superadmin : admins « client » (rôle `admin`) pour assignation à la création d’une aventure. */
export async function listAdminUsersForNewAdventureScope(): Promise<
  AdminScopePickerUser[]
> {
  const actor = await getUser();
  if (!actor || !isSuperadmin(actor.role)) {
    return [];
  }

  return prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, name: true, email: true },
    orderBy: [{ email: "asc" }],
  });
}

export async function getAdventureAdminScopeEditorData(adventureId: string) {
  const actor = await getUser();
  if (!actor || !isSuperadmin(actor.role)) {
    return { ok: false as const, error: "Non autorisé." };
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { id: true },
  });
  if (!adventure) {
    return { ok: false as const, error: "Aventure introuvable." };
  }

  const [admins, accesses] = await Promise.all([
    prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true, name: true, email: true },
      orderBy: [{ email: "asc" }],
    }),
    prisma.adminAdventureAccess.findMany({
      where: { adventureId },
      select: { userId: true },
    }),
  ]);

  return {
    ok: true as const,
    admins,
    assignedAdminIds: accesses.map((a) => a.userId),
  };
}

export type AdventureAdminScopeEditorResult = Awaited<
  ReturnType<typeof getAdventureAdminScopeEditorData>
>;
