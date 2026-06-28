"use server";

import { rm } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  gateAdventureAction,
  gateAdventureUpdateContent,
} from "@/lib/adventure-authorization";
import { applyApprovedReviewAlerts } from "@/lib/game/apply-approved-review-alerts";
import { deleteUploadsFileByUrl } from "@/lib/uploads/delete-uploads-file";

export async function statusAdventure(id: string, status: boolean) {
  const gate = await gateAdventureUpdateContent(id);
  if (!gate.ok) {
    throw new Error("Non autorisé.");
  }
  const updated = await prisma.adventure.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/");
  revalidatePath("/admin-game/dashboard/aventures");
  revalidatePath(`/admin-game/dashboard/aventures/${id}`);
  return updated;
}

const MSG_NO_DELETE_RIGHT =
  "Vous n’avez pas l’autorisation de supprimer cette aventure.";

async function deleteAdventureUploadFiles(
  adventureId: string,
  imageUrls: Array<string | null | undefined>,
) {
  for (const url of imageUrls) {
    await deleteUploadsFileByUrl(url);
  }

  const uploadsDir = path.join(process.cwd(), "uploads", "adventures", adventureId);
  try {
    await rm(uploadsDir, { recursive: true, force: true });
  } catch {
    /* dossier absent ou déjà supprimé */
  }
}

export async function RemoveAdventure(adventureId: string) {
  const gate = await gateAdventureAction(adventureId, "delete");
  if (!gate.ok) {
    return {
      success: false,
      message: MSG_NO_DELETE_RIGHT,
    };
  }

  try {
    const snapshot = await prisma.adventure.findUnique({
      where: { id: adventureId },
      select: {
        name: true,
        coverImageUrl: true,
        enigmas: { select: { imageUrl: true } },
        treasure: { select: { imageUrl: true } },
      },
    });

    if (!snapshot) {
      return {
        success: false,
        message: "Aventure introuvable.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.userAdventurePartnerLotWin.deleteMany({ where: { adventureId } });
      await tx.adventurePartnerLot.deleteMany({ where: { adventureId } });

      // Avis : détacher l’aventure, conserver le nom et les photos joueurs.
      await tx.adventureReview.updateMany({
        where: { adventureId },
        data: {
          archivedAdventureName: snapshot.name,
          adventureId: null,
        },
      });

      // Badges joueurs : détacher la définition d’aventure (UserBadge inchangés).
      await tx.badgeDefinition.updateMany({
        where: { adventureId },
        data: { adventureId: null },
      });

      // Points de découverte : conserver en POI ville (cityId inchangé).
      await tx.discoveryPoint.updateMany({
        where: { adventureId },
        data: { adventureId: null },
      });

      await tx.userAdventures.deleteMany({ where: { adventureId } });
      await tx.enigma.deleteMany({ where: { adventureId } });
      await tx.treasure.deleteMany({ where: { adventureId } });
      await tx.adventure.delete({ where: { id: adventureId } });
    });

    const imageUrls = [
      snapshot.coverImageUrl,
      snapshot.treasure?.imageUrl,
      ...snapshot.enigmas.map((enigma) => enigma.imageUrl),
    ];
    await deleteAdventureUploadFiles(adventureId, imageUrls);

    revalidatePath("/");
    revalidatePath("/admin-game/dashboard/aventures");
    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    return {
      success: true,
      message: "Aventure supprimée.",
    };
  } catch (error) {
    console.error("RemoveAdventure:", error);
    return {
      success: false,
      message: "Erreur lors de la suppression de l’aventure.",
    };
  }
}

export async function changeReviewStatus(
  adventureReviewId: string,
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
) {
  const existing = await prisma.adventureReview.findUnique({
    where: { id: adventureReviewId },
    select: {
      id: true,
      adventureId: true,
      content: true,
      reportsMissingBadge: true,
      reportsStolenTreasure: true,
      moderationStatus: true,
    },
  });
  if (!existing) {
    throw new Error("Avis introuvable.");
  }

  if (!existing.adventureId) {
    throw new Error("Cet avis n’est plus rattaché à une aventure active.");
  }

  const adventureId = existing.adventureId;

  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    throw new Error("Non autorisé.");
  }

  const session = await auth.api.getSession({ headers: await headers() });

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.adventureReview.update({
      where: { id: adventureReviewId },
      data: { moderationStatus: status },
    });

    if (
      status === "APPROVED" &&
      existing.moderationStatus !== "APPROVED"
    ) {
      await applyApprovedReviewAlerts(tx, {
        adventureId,
        reportsStolenTreasure: existing.reportsStolenTreasure,
        reportsMissingBadge: existing.reportsMissingBadge,
        reviewContent: existing.content,
        actorUserId: session?.user?.id ?? null,
      });
    }

    return row;
  });

  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  revalidatePath("/admin-game/dashboard");
  return updated;
}
