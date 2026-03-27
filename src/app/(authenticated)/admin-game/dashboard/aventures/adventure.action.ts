"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import {
  getManagedAdventureIds,
  isAdminRole,
  isSuperadmin,
} from "@/lib/admin-access";
import { roleHasAdventurePermission } from "@/lib/permissions";
import type { Prisma } from "../../../../../../generated/prisma/browser";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";

export type CreateAdventureInput = {
  name: string;
  description: Prisma.InputJsonValue;
  city: string;
  status?: boolean;
  latitude: number;
  longitude: number;
  /** Réservé au superadmin : ids utilisateurs `role === "admin"`. */
  assignedAdminIds?: string[];
};

export async function createAdventure(
  form: CreateAdventureInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { success: false, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "create")) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    let scopeUserIdsToRevalidate: string[] = [];
    const result = await prisma.$transaction(async (tx) => {
      const adventure = await tx.adventure.create({
        data: {
          name: form.name,
          description: form.description,
          city: form.city,
          latitude: form.latitude,
          longitude: form.longitude,
          distance: null,
          creatorId: user.id,
        },
      });

      if (isSuperadmin(user.role) && form.assignedAdminIds?.length) {
        const uniqueIds: string[] = [...new Set(form.assignedAdminIds)];
        const validCount = await tx.user.count({
          where: { id: { in: uniqueIds }, role: "admin" },
        });
        if (validCount !== uniqueIds.length) {
          throw new Error(
            "Un ou plusieurs comptes ne sont pas des administrateurs (rôle « admin »)."
          );
        }
        await tx.adminAdventureAccess.createMany({
          data: uniqueIds.map((userId) => ({
            userId,
            adventureId: adventure.id,
          })),
        });
        await tx.adminAuditLog.create({
          data: {
            action: "adventure.admin.scope.updated",
            actorUserId: user.id,
            targetUserId: null,
            payload: {
              adventureId: adventure.id,
              adminUserIds: uniqueIds,
            },
          },
        });
        scopeUserIdsToRevalidate = uniqueIds;
      }

      return adventure;
    });

    await syncAdventureRouteDistance(result.id);

    for (const uid of scopeUserIdsToRevalidate) {
      revalidatePath(`/admin-game/dashboard/utilisateurs/${uid}`);
    }
    revalidatePath("/admin-game/dashboard/aventures");
    revalidatePath(`/admin-game/dashboard/aventures/${result.id}`);
    revalidatePath("/admin-game/dashboard/journal-admin");
    return { success: true, id: result.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’aventure.",
    };
  }
} 

export async function listAdventures() {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "read")) {
    return { ok: false as const, error: "Non autorisé." };
  }
  try {
    const managedAdventureIds = isSuperadmin(user.role)
      ? null
      : await getManagedAdventureIds(user.id);

    if (managedAdventureIds !== null && managedAdventureIds.length === 0) {
      return { ok: true as const, adventures: [] };
    }

    const where =
      managedAdventureIds !== null ? { id: { in: managedAdventureIds } } : {};

    const adventures = await prisma.adventure.findMany({ where });

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
}

  export async function listAdventuresForAdmin(params: {
    page: number;
    pageSize: number;
    search: string;
  }): Promise<
    { ok: true; adventure: AdventureListItem[]; total: number } | { ok: false; error: string }
  > {
    const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
      return { ok: false, error: "Non autorisé." };
    }
  if (!roleHasAdventurePermission(user.role, "read")) {
    return { ok: false, error: "Non autorisé." };
  }
  
    const skip = (params.page - 1) * params.pageSize;
    const q = params.search.trim();
  
    const where =
      q.length > 0
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { city: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {};
  
    try {
    const managedAdventureIds = isSuperadmin(user.role)
      ? null
      : await getManagedAdventureIds(user.id);

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
            city: true,
            status: true,
    
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
          city: u.city,
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



