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

export async function statusAdventure(id: string, status: boolean) {
  const gate = await gateAdventureUpdateContent(id);
  if (!gate.ok) {
    throw new Error("Non autorisé.");
  }
  return await prisma.adventure.update({
    where: { id },
    data: { status },
  });
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
