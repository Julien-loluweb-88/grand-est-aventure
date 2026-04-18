"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../../../../../generated/prisma/browser";
import { gateAdventureUpdateContent } from "@/lib/adventure-authorization";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";
import { deleteUploadsFileByUrl } from "@/lib/uploads/delete-uploads-file";

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
  /** QCM : le joueur peut cocher plusieurs réponses. */
  multiSelect: boolean;
  /** Libellés des choix corrects (si `multiSelect`). */
  correctAnswers: string[];
  answer: string;
  answerMessage: Prisma.InputJsonValue;
  description: Prisma.InputJsonValue;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  adventureId: string;
};

/** Création : le numéro d’ordre est attribué automatiquement (max + 1). */
export type CreateEnigmaInput = EnigmaMutationFields;

export type UpdateEnigmaInput = EnigmaMutationFields & { number: number };

export async function createEnigma(
  form: CreateEnigmaInput
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

  const maxRow = await prisma.enigma.aggregate({
    where: { adventureId: form.adventureId },
    _max: { number: true },
  });
  const nextNumber = (maxRow._max.number ?? 0) + 1;

  try {
    const choiceJson = form.choice;
    const choicesStr = Array.isArray(choiceJson)
      ? choiceJson.filter((c): c is string => typeof c === "string" && c.trim() !== "")
      : [];
    const hasChoices = choicesStr.length > 0;
    const correctJson =
      form.multiSelect && form.correctAnswers.length > 0
        ? form.correctAnswers
        : Prisma.DbNull;
    const result = await prisma.enigma.create({
      data: {
        name: form.name,
        number: nextNumber,
        question: form.question,
        uniqueResponse: form.uniqueResponse,
        choice: form.choice,
        multiSelect: form.multiSelect,
        correctAnswers: correctJson,
        answer: form.multiSelect && hasChoices ? "" : form.answer,
        answerMessage: form.answerMessage,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        imageUrl: form.imageUrl?.trim() || null,
        adventureId: form.adventureId,
      },
    });
    await syncAdventureRouteDistance(form.adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return {
      success: true,
      id: result.id,
      message: "Énigme créée avec succès.",
    };
  } catch (e) {
    if (isNumberUniqueError(e)) {
      return {
        success: false,
        error: "Ce numéro d’énigme est déjà utilisé pour cette aventure.",
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’énigme.",
    };
  }
}

/** Réattribue les numéros 1…n selon l’ordre des ids (parcours + itinéraire). */
export async function reorderEnigmas(
  adventureId: string,
  orderedIds: string[]
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
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
  const gate = await gateAdventureUpdateContent(form.adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    const prev = await prisma.enigma.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    const choiceJson = form.choice;
    const choicesStr = Array.isArray(choiceJson)
      ? choiceJson.filter((c): c is string => typeof c === "string" && c.trim() !== "")
      : [];
    const hasChoices = choicesStr.length > 0;
    const correctJson =
      form.multiSelect && form.correctAnswers.length > 0
        ? form.correctAnswers
        : Prisma.DbNull;
    const result = await prisma.enigma.update({
      where: { id },
      data: {
        name: form.name,
        number: form.number,
        question: form.question,
        uniqueResponse: form.uniqueResponse,
        choice: form.choice,
        multiSelect: form.multiSelect,
        correctAnswers: correctJson,
        answer: form.multiSelect && hasChoices ? "" : form.answer,
        answerMessage: form.answerMessage,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        imageUrl: form.imageUrl?.trim() || null,
        adventureId: form.adventureId,
      },
    });

    const nextImage = form.imageUrl?.trim() || null;
    if (prev?.imageUrl && prev.imageUrl !== nextImage) {
      await deleteUploadsFileByUrl(prev.imageUrl);
    }

    await syncAdventureRouteDistance(form.adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return {
      success: true,
      id: result.id,
      message: "Énigme mise à jour avec succès.",
    };
  } catch (e) {
    if (isNumberUniqueError(e)) {
      return {
        success: false,
        error: "Ce numéro d’énigme est déjà utilisé pour cette aventure.",
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de mettre à jour l’énigme.",
    };
  }
}

export async function deleteEnigma(
  id: string,
  adventureId: string
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    const prev = await prisma.enigma.findFirst({
      where: { id, adventureId },
      select: { imageUrl: true },
    });

    const result = await prisma.enigma.deleteMany({
      where: { id, adventureId },
    });
    if (result.count === 0) {
      return { success: false, error: "Énigme introuvable." };
    }

    if (prev?.imageUrl) {
      await deleteUploadsFileByUrl(prev.imageUrl);
    }

    await syncAdventureRouteDistance(adventureId);
    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    return { success: true, message: "Énigme supprimée." };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression de l’énigme.",
    };
  }
}
