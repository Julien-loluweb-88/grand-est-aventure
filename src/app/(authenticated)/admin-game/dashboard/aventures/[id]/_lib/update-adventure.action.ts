"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AdventureWriteInput } from "@/lib/adventure-write-input";
import { gateAdventureUpdateContent } from "@/lib/adventure-authorization";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";
import { deleteUploadsFileByUrl } from "@/lib/uploads/delete-uploads-file";
import { syncPhysicalBadgeInstances } from "@/lib/badges/sync-physical-instances";
import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { AdventureAudience } from "../../../../../../../../generated/prisma/client";

/** Action isolée : évite de regrouper toutes les mutations avec la page RSC. */
export async function updateAdventure(
  id: string,
  form: AdventureWriteInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(id);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    const prev = await prisma.adventure.findUnique({
      where: { id },
      select: {
        coverImageUrl: true,
        physicalBadgeStockCount: true,
        virtualBadge: { select: { id: true, imageUrl: true } },
      },
    });

    const cityExists = await prisma.city.count({ where: { id: form.cityId } });
    if (cityExists === 0) {
      return { success: false, error: "Ville introuvable." };
    }

    const stock = Math.max(0, Math.floor(form.physicalBadgeStockCount ?? 0));
    const result = await prisma.$transaction(async (tx) => {
      const adv = await tx.adventure.update({
        where: { id },
        data: {
          name: form.name,
          description: form.description,
          cityId: form.cityId,
          latitude: form.latitude,
          longitude: form.longitude,
          coverImageUrl: form.coverImageUrl?.trim() || null,
          physicalBadgeStockCount: stock,
          audience:
            form.audience === "DEMO"
              ? AdventureAudience.DEMO
              : AdventureAudience.PUBLIC,
        },
      });

      const bd = await tx.badgeDefinition.findUnique({
        where: { adventureId: id },
      });
      if (bd) {
        await tx.badgeDefinition.update({
          where: { id: bd.id },
          data: {
            title: form.name,
            imageUrl: form.badgeImageUrl?.trim() || null,
          },
        });
      } else {
        await tx.badgeDefinition.create({
          data: {
            slug: `adventure-${id}`,
            title: form.name,
            imageUrl: form.badgeImageUrl?.trim() || null,
            kind: BadgeDefinitionKind.ADVENTURE_COMPLETE,
            adventureId: id,
          },
        });
      }

      await syncPhysicalBadgeInstances(tx, id, stock);

      return adv;
    });

    const nextCover = form.coverImageUrl?.trim() || null;
    const nextBadge = form.badgeImageUrl?.trim() || null;
    if (prev?.coverImageUrl && prev.coverImageUrl !== nextCover) {
      await deleteUploadsFileByUrl(prev.coverImageUrl);
    }
    const prevBadgeUrl = prev?.virtualBadge?.imageUrl ?? null;
    if (prevBadgeUrl && prevBadgeUrl !== nextBadge) {
      await deleteUploadsFileByUrl(prevBadgeUrl);
    }

    await syncAdventureRouteDistance(id);
    revalidatePath("/");
    revalidatePath("/admin-game/dashboard/aventures");
    revalidatePath(`/admin-game/dashboard/aventures/${id}`);
    return { success: true, id: result.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de mettre à jour l’aventure.",
    };
  }
}
