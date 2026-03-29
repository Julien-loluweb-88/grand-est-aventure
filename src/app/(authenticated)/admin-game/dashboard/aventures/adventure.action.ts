"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  canCreateAdventure,
  getAdminActorForAuthorization,
} from "@/lib/adventure-authorization";
import { getManagedAdventureIds, isSuperadmin } from "@/lib/admin-access";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import type { Prisma } from "../../../../../../generated/prisma/browser";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";
import { migrateAdventureDraftEditorUploads } from "@/lib/uploads/migrate-adventure-draft-editor-uploads";

export type CreateAdventureInput = {
  name: string;
  description: Prisma.InputJsonValue;
  city: string;
  status?: boolean;
  latitude: number;
  longitude: number;
  coverImageUrl?: string | null;
  badgeImageUrl?: string | null;
  /** Réservé au superadmin : ids utilisateurs `role === "admin"`. */
  assignedAdminIds?: string[];
  /** UUID client : images TipTap (`drafts/{id}/editor/`) migrées vers l’aventure créée. */
  descriptionDraftId?: string | null;
};

export async function createAdventure(
  form: CreateAdventureInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { success: false, error: "Non autorisé." };
  }
  if (!(await canCreateAdventure())) {
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
          creatorId: actor.id,
          coverImageUrl: form.coverImageUrl?.trim() || null,
          badgeImageUrl: form.badgeImageUrl?.trim() || null,
        },
      });

      if (isSuperadmin(actor.role) && form.assignedAdminIds?.length) {
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
            actorUserId: actor.id,
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

    const draftId = form.descriptionDraftId?.trim();
    if (draftId) {
      const nextDescription = await migrateAdventureDraftEditorUploads({
        draftId,
        adventureId: result.id,
        description: result.description as Prisma.InputJsonValue,
      });
      if (
        JSON.stringify(nextDescription) !==
        JSON.stringify(result.description)
      ) {
        await prisma.adventure.update({
          where: { id: result.id },
          data: { description: nextDescription },
        });
      }
    }

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
            { city: { contains: q, mode: "insensitive" as const } },
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
