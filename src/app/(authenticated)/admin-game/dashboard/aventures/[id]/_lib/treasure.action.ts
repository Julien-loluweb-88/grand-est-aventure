"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../../../../../generated/prisma/browser";
import {
  gateAdventureAction,
  gateAdventureUpdateContent,
} from "@/lib/adventure-authorization";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";
import { deleteUploadsFileByUrl } from "@/lib/uploads/delete-uploads-file";

export type CreateTrasureInput = {
  name: string;
  description: Prisma.InputJsonValue;
  latitude: number;
  longitude: number;
  code: string;
  safeCode: string;
  imageUrl?: string | null;
  adventureId: string;
};

export async function createTrasure(
  form: CreateTrasureInput
): Promise<{ success: true; id: string; message: string } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(form.adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }
  const adventure = await prisma.adventure.findUnique({
    where: { id: form.adventureId },
  });
  if (!adventure) {
    return { success: false, error: "Aventure introuvable." };
  }

  try {
    const result = await prisma.treasure.create({
      data: {
        name: form.name,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        code: form.code,
        safeCode: form.safeCode,
        imageUrl: form.imageUrl?.trim() || null,
        adventureId: form.adventureId,
      },
    });
    await syncAdventureRouteDistance(form.adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return { success: true, id: result.id, message: "Trésor créé avec succès." };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer un trésor.",
    };
  }
}

export async function updateTreasure(
  treasureId: string,
  form: CreateTrasureInput
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(form.adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  const existing = await prisma.treasure.findUnique({
    where: { id: treasureId },
    select: { id: true, adventureId: true, imageUrl: true },
  });
  if (!existing || existing.adventureId !== form.adventureId) {
    return { success: false, error: "Trésor introuvable." };
  }

  try {
    await prisma.treasure.update({
      where: { id: treasureId },
      data: {
        name: form.name,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        code: form.code,
        safeCode: form.safeCode,
        imageUrl: form.imageUrl?.trim() || null,
      },
    });

    const nextImage = form.imageUrl?.trim() || null;
    if (existing.imageUrl && existing.imageUrl !== nextImage) {
      await deleteUploadsFileByUrl(existing.imageUrl);
    }

    await syncAdventureRouteDistance(form.adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Impossible de mettre à jour le trésor.",
    };
  }
}

export async function deleteTreasure(
  treasureId: string,
  adventureId: string
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  const existing = await prisma.treasure.findUnique({
    where: { id: treasureId },
    select: { adventureId: true, imageUrl: true },
  });
  if (!existing || existing.adventureId !== adventureId) {
    return { success: false, error: "Trésor introuvable." };
  }

  try {
    await prisma.treasure.delete({ where: { id: treasureId } });

    if (existing.imageUrl) {
      await deleteUploadsFileByUrl(existing.imageUrl);
    }

    await syncAdventureRouteDistance(adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    return { success: true, message: "Trésor supprimé." };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Impossible de supprimer le trésor.",
    };
  }
}

export async function getTreasure(adventureId: string) {
  const gate = await gateAdventureAction(adventureId, "read");
  if (!gate.ok) {
    return null;
  }

  return await prisma.adventure.findUnique({
    where: { id: adventureId },
    include: {
      treasure: true,
    },
  });
}
