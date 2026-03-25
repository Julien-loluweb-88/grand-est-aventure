"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { Prisma } from "../../../../../../../generated/prisma/browser";

const ADMIN_ROLES = ["admin", "superadmin"] as const;

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
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Non authentifié." };
  } 
  try{
    const result = await prisma.enigma.create({
        data: {
            name: form.name,
            number: form.number,
            question: form.question,
            uniqueResponse: form.uniqueResponse,
            choice: form.choice,
            answer: form.answer,
            answerMessage: form.answer,
            description: form.description,
            latitude: form.latitude,
            longitude: form.longitude,
            adventureId: form.adventureId,
        },
    });
    revalidatePath("/admin-game/dashboard/aventures/enigme");
    return { success: true, id: result.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’aventure.",
    };
}
}