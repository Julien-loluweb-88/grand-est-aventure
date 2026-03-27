"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { Prisma } from "../../../../../../../generated/prisma/browser";
import { canManageAdventure, isAdminRole } from "@/lib/admin-access";
import { roleHasAdventurePermission } from "@/lib/permissions";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";

export type CreateTrasureInput = {
    name: string;
    description: Prisma.InputJsonValue;
    latitude: number;
    longitude: number;
    code: string;
    safeCode: string;
    adventureId: string;
}

export async function createTrasure(
    form: CreateTrasureInput
): Promise<{ success: true; id: string; message: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { success: false, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "update")) {
    return { success: false, error: "Non autorisé." };
  }
  if (!(await canManageAdventure({ userId: user.id, role: user.role, adventureId: form.adventureId }))) {
    return { success: false, error: "Non autorisé." };
  }
  const adventure = await prisma.adventure.findUnique({
    where: { id: form.adventureId },
  });
  if (!adventure) {
    return { success: false, error: "Aventure non trouvée." };
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
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { success: false, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "update")) {
    return { success: false, error: "Non autorisé." };
  }
  if (
    !(await canManageAdventure({
      userId: user.id,
      role: user.role,
      adventureId: form.adventureId,
    }))
  ) {
    return { success: false, error: "Non autorisé." };
  }

  const existing = await prisma.treasure.findUnique({
    where: { id: treasureId },
    select: { id: true, adventureId: true },
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
      },
    });
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
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { success: false, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "update")) {
    return { success: false, error: "Non autorisé." };
  }
  if (
    !(await canManageAdventure({
      userId: user.id,
      role: user.role,
      adventureId,
    }))
  ) {
    return { success: false, error: "Non autorisé." };
  }

  const existing = await prisma.treasure.findUnique({
    where: { id: treasureId },
    select: { adventureId: true },
  });
  if (!existing || existing.adventureId !== adventureId) {
    return { success: false, error: "Trésor introuvable." };
  }

  try {
    await prisma.treasure.delete({ where: { id: treasureId } });
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

export async function getTreasure(id: string) {
  const user = await getUser();
  if (!user) {
    return null;
  }
  if (!roleHasAdventurePermission(user.role, "read")) {
    return null;
  }
  if (!(await canManageAdventure({ userId: user.id, role: user.role, adventureId: id }))) {
    return null;
  }

  return await prisma.adventure.findUnique({
    where: { id },
    include: {
      treasure: true,
    },
  })
}