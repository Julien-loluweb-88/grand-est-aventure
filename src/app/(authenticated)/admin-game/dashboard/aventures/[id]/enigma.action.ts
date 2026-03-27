"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { Prisma } from "../../../../../../../generated/prisma/browser";
import { canManageAdventure, isAdminRole } from "@/lib/admin-access";
import { roleHasAdventurePermission } from "@/lib/permissions";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";

function isNumberUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export type EnigmaMutationFields = {
  name: string;
  question: string;
  uniqueResponse: boolean;
  choice: Prisma.InputJsonValue;
  answer: string;
  answerMessage: Prisma.InputJsonValue;
  description: Prisma.InputJsonValue;
  latitude: number;
  longitude: number;
  adventureId: string;
};

/** Création : le numéro d’ordre est attribué automatiquement (max + 1). */
export type CreateEnigmaInput = EnigmaMutationFields;

export type UpdateEnigmaInput = EnigmaMutationFields & { number: number };

export async function createEnigma(
  form: CreateEnigmaInput
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
  // Vérifier si l'aventure existe
  const adventure = await prisma.adventure.findUnique({
    where: { id: form.adventureId },
  });
  if (!adventure) {
    return { success: false, error: "Aventure non trouvée." };
  }

  const maxRow = await prisma.enigma.aggregate({
    where: { adventureId: form.adventureId },
    _max: { number: true },
  });
  const nextNumber = (maxRow._max.number ?? 0) + 1;

  try {
    const result = await prisma.enigma.create({
      data: {
        name: form.name,
        number: nextNumber,
        question: form.question,
        uniqueResponse: form.uniqueResponse,
        choice: form.choice,
        answer: form.answer,
        answerMessage: form.answerMessage,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        adventureId: form.adventureId,
      },
    });
    await syncAdventureRouteDistance(form.adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return { success: true, id: result.id, message: "Enigme créée avec succès." };
  } catch (e) {
    if (isNumberUniqueError(e)) {
      return {
        success: false,
        error: "Le numéro d'énigme existe déjà pour cette aventure.",
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’aventure.",
    };
  }
}

/** Réattribue les numéros 1…n selon l’ordre des ids (parcours + itinéraire). */
export async function reorderEnigmas(
  adventureId: string,
  orderedIds: string[]
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
      adventureId,
    }))
  ) {
    return { success: false, error: "Non autorisé." };
  }

  const existing = await prisma.enigma.findMany({
    where: { adventureId },
    select: { id: true },
  });
  const idSet = new Set(existing.map((e) => e.id));

  if (existing.length === 0) {
    return { success: false, error: "Aucune énigme à réordonner." };
  }
  if (orderedIds.length !== existing.length) {
    return { success: false, error: "La liste d’énigmes est incomplète." };
  }
  if (new Set(orderedIds).size !== orderedIds.length) {
    return { success: false, error: "Ordre invalide (doublon)." };
  }
  for (const eid of orderedIds) {
    if (!idSet.has(eid)) {
      return { success: false, error: "Énigme invalide pour cette aventure." };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.enigma.update({
          where: { id: orderedIds[i] },
          data: { number: -(i + 1) },
        });
      }
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.enigma.update({
          where: { id: orderedIds[i] },
          data: { number: i + 1 },
        });
      }
    });
    await syncAdventureRouteDistance(adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Impossible de réordonner les énigmes.",
    };
  }
}

export async function updateEnigma(
  id: string,
  form: UpdateEnigmaInput
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

  try {
    const result = await prisma.enigma.update({
      where: { id },
      data: {
        name: form.name,
        number: form.number,
        question: form.question,
        uniqueResponse: form.uniqueResponse,
        choice: form.choice,
        answer: form.answer,
        answerMessage: form.answerMessage,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        adventureId: form.adventureId,
      },
    });
    await syncAdventureRouteDistance(form.adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return { success: true, id: result.id, message: "Enigme modifie avec succès." };
  } catch (e) {
    if (isNumberUniqueError(e)) {
      return {
        success: false,
        error: "Le numéro d'énigme existe déjà pour cette aventure.",
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’aventure.",
    };
  }
}

export async function deleteEnigma(
  id: string,
  adventureId: string
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { success: false, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "update")) {
    return { success: false, error: "Non autorisé." };
  }
  if (!(await canManageAdventure({ userId: user.id, role: user.role, adventureId }))) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    const result = await prisma.enigma.deleteMany({
      where: { id, adventureId },
    });
    if (result.count === 0) {
      return { success: false, error: "Énigme introuvable." };
    }
    await syncAdventureRouteDistance(adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    return { success: true, message: "Énigme supprimée avec succès." };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur lors de la suppression de l'énigme.",
    };
  }
}