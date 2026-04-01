"use server";

import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { getManagedAdventureIds, isSuperadmin } from "@/lib/admin-access";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";

export async function listAdventures() {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return { ok: false as const, error: "Non autorisé." };
  }
  try {
    const managedAdventureIds = isSuperadmin(actor.role)
      ? null
      : await getManagedAdventureIds(actor.id);

    if (managedAdventureIds !== null && managedAdventureIds.length === 0) {
      return { ok: true as const, adventures: [] };
    }

    const where =
      managedAdventureIds !== null ? { id: { in: managedAdventureIds } } : {};

    const adventures = await prisma.adventure.findMany({
      where,
      include: { city: { select: { name: true } } },
    });

    return {
      ok: true as const,
      adventures,
    };
  } catch {
    return {
      ok: false as const,
      error: "Erreur lors du chargement des aventures.",
    };
  }
}

export type AdventureListItem = {
  id: string;
  name: string;
  city: string;
  status: boolean;
};

export async function listAdventuresForAdmin(params: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<
  { ok: true; adventure: AdventureListItem[]; total: number } | { ok: false; error: string }
> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { ok: false, error: "Non autorisé." };
  }
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return { ok: false, error: "Non autorisé." };
  }

  const skip = (params.page - 1) * params.pageSize;
  const q = params.search.trim();

  const where =
    q.length > 0
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            {
              city: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

  try {
    const managedAdventureIds = isSuperadmin(actor.role)
      ? null
      : await getManagedAdventureIds(actor.id);

    if (managedAdventureIds !== null && managedAdventureIds.length === 0) {
      return { ok: true, adventure: [], total: 0 };
    }

    const scopedWhere = {
      ...where,
      ...(managedAdventureIds !== null
        ? { id: { in: managedAdventureIds } }
        : {}),
    };

    const [adventure, total] = await Promise.all([
      prisma.adventure.findMany({
        where: scopedWhere,
        select: {
          id: true,
          name: true,
          status: true,
          city: { select: { name: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: params.pageSize,
      }),
      prisma.adventure.count({ where: scopedWhere }),
    ]);

    return {
      ok: true,
      adventure: adventure.map((u) => ({
        id: u.id,
        name: u.name,
        city: u.city.name,
        status: u.status ?? false,
      })),
      total,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors du chargement des aventures.",
    };
  }
}

type UserAdventureListItem = {
  id: string
  adventureId: string
  giftNumber: number
  success: boolean
  updatedAt: string
  user: {
    id: string
    name: string
  }
}

export async function listUserAdventuresForAdmin(params: {
  page: number
  pageSize: number
  search: string
}): Promise<
  | { ok: true; userAdventures: UserAdventureListItem[]; total: number }
  | { ok: false; error: string }
> {
const actor = await getAdminActorForAuthorization()
  if (!actor) {
    return { ok: false, error: "Non autorisé." }
  }
if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return { ok: false, error: "Non autorisé." };
  }
  const skip = (params.page - 1) * params.pageSize
  const q = params.search.trim()

  const where =
    q.length > 0
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" as const} } },
            { adventure: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}
try{
  const managedAdventureIds = isSuperadmin(actor.role)
      ? null
      : await getManagedAdventureIds(actor.id)

    if (managedAdventureIds !== null && managedAdventureIds.length === 0) {
      return { ok: true, userAdventures: [], total: 0 }
    }
const scopedWhere = {
      ...where,
      ...(managedAdventureIds !== null ? { adventureId: { in: managedAdventureIds } } : {}),
    }

    const [userAdventures, total] = await Promise.all([
      prisma.userAdventures.findMany({
        where: scopedWhere,
    select: {
      id: true,
      adventureId: true,
      giftNumber: true,
      success: true,
      updatedAt: true,
      user: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: params.pageSize,
      }),
      prisma.userAdventures.count({ where: scopedWhere }),
    ])

    return { ok: true, 
      userAdventure: userAdventure.map((ua) => ({
        id: ua.id,
      adventureId: ua.adventureId,
      giftNumber: ua.giftNumber,
      success: ua.success,
      updatedAt: ua.updatedAt.toISOString(),
      user: { id: ua.user.id, name: ua.user.name ?? "" },
      })), total,
  };
} catch (e) {
  return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors du chargement des aventures.",
    };
  }
}