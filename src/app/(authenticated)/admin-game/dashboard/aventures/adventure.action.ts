"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";

export type CreateAdventureInput = {
  name: string;
  description: string;
  city: string;
  latitude: number;
  longitude: number;
  distance: number;
};

export async function createAdventure(
  form: CreateAdventureInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Non authentifié." };
  }

  try {
    const result = await prisma.adventure.create({
      data: {
        name: form.name,
        description: form.description,
        city: form.city,
        latitude: form.latitude,
        longitude: form.longitude,
        distance: form.distance,
        creatorId: user.id,
      },
    });
    revalidatePath("/admin-game/dashboard/aventures");
    return { success: true, id: result.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’aventure.",
    };
  }
}
