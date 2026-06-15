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

export async function RemoveAdventure(adventureId: string) {
  const gate = await gateAdventureAction(adventureId, "delete");
  if (!gate.ok) {
    return {
      success: false,
      message: MSG_NO_DELETE_RIGHT,
    };
  }

  try {
    await prisma.adventure.delete({
      where: {
        id: adventureId,
      },
    });

    const uploadsDir = path.join(process.cwd(), "uploads", "adventures", adventureId);
    try {
      await rm(uploadsDir, { recursive: true, force: true });
    } catch {
      /* dossier absent ou déjà supprimé */
    }

    revalidatePath("/");
    revalidatePath("/admin-game/dashboard/aventures");
    return {
      success: true,
      message: "Aventure supprimée.",
    };
  } catch {
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

  const gate = await gateAdventureUpdateContent(existing.adventureId);
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
        adventureId: existing.adventureId,
        reportsStolenTreasure: existing.reportsStolenTreasure,
        reportsMissingBadge: existing.reportsMissingBadge,
        reviewContent: existing.content,
        actorUserId: session?.user?.id ?? null,
      });
    }

    return row;
  });

  revalidatePath(`/admin-game/dashboard/aventures/${existing.adventureId}`);
  revalidatePath("/admin-game/dashboard");
  return updated;
}
