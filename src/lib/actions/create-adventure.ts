"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  canCreateAdventure,
  getAdminActorForAuthorization,
} from "@/lib/adventure-authorization";
import { isSuperadmin } from "@/lib/admin-access";
import type { Prisma } from "../../../generated/prisma/browser";
import { AdventureAudience } from "../../../generated/prisma/client";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";
import { migrateAdventureDraftEditorUploads } from "@/lib/uploads/migrate-adventure-draft-editor-uploads";
import type { AdventureWriteInput } from "@/lib/adventure-write-input";
import {
  AdventureBadgeInstanceStatus,
  AdventureBadgeStockEventKind,
  BadgeDefinitionKind,
} from "@/lib/badges/prisma-enums";
import { syncPhysicalBadgeInstances } from "@/lib/badges/sync-physical-instances";

export async function createAdventure(
  form: AdventureWriteInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { success: false, error: "Non autorisé." };
  }
  if (!(await canCreateAdventure())) {
    return { success: false, error: "Non autorisé." };
  }

  const cityExists = await prisma.city.count({ where: { id: form.cityId } });
  if (cityExists === 0) {
    return { success: false, error: "Ville introuvable. Créez-la ou choisissez-en une autre dans la liste." };
  }

  try {
    let scopeUserIdsToRevalidate: string[] = [];
    const result = await prisma.$transaction(async (tx) => {
      const stock = Math.max(0, Math.floor(form.physicalBadgeStockCount ?? 0));
      const adventure = await tx.adventure.create({
        data: {
          name: form.name,
          description: form.description,
          cityId: form.cityId,
          latitude: form.latitude,
          longitude: form.longitude,
          distance: null,
          creatorId: actor.id,
          coverImageUrl: form.coverImageUrl?.trim() || null,
          physicalBadgeStockCount: stock,
          audience:
            form.audience === "DEMO"
              ? AdventureAudience.DEMO
              : AdventureAudience.PUBLIC,
        },
      });

      await tx.badgeDefinition.create({
        data: {
          slug: `adventure-${adventure.id}`,
          title: form.name,
          imageUrl: form.badgeImageUrl?.trim() || null,
          kind: BadgeDefinitionKind.ADVENTURE_COMPLETE,
          adventureId: adventure.id,
        },
      });

      await syncPhysicalBadgeInstances(tx, adventure.id, stock);

      if (stock > 0) {
        const availableAfter = await tx.adventureBadgeInstance.count({
          where: {
            adventureId: adventure.id,
            status: AdventureBadgeInstanceStatus.AVAILABLE,
          },
        });
        await tx.adventureBadgeStockEvent.create({
          data: {
            adventureId: adventure.id,
            kind: AdventureBadgeStockEventKind.INITIAL_SETUP,
            availableDelta: stock,
            availableAfter,
            note: "Mise en stock initiale lors de la création de l’aventure.",
            createdByUserId: actor.id,
          },
        });
      }

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
