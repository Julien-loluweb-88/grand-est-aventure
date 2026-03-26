"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { Prisma } from "../../../../../../../generated/prisma/browser";

export type createEnigmaInput = {
  name: string;
  number: number;
  question: string;
  uniqueResponse: boolean;
  choice: Prisma.InputJsonValue;
  answer: string;
  answerMessage: string;
  description: Prisma.InputJsonValue;
  latitude: number;
  longitude: number;
  adventureId: string;
}
export async function createEnigma(
  form: createEnigmaInput
): Promise<{ success: true; id: string; message: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Non authentifié." };
  }
  // Vérifier si l'aventure existe
  const adventure = await prisma.adventure.findUnique({
    where: { id: form.adventureId },
  });
  if (!adventure) {
    return { success: false, error: "Aventure non trouvée." };
  }

  try {
    const result = await prisma.enigma.create({
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
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return { success: true, id: result.id, message: "Enigme créée avec succès." };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’aventure.",
    };
  }
}