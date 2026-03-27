"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { Prisma } from "../../../../../../../generated/prisma/browser";

const ADMIN_ROLES = ["admin", "superadmin"] as const;

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
  if (!user || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
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
    revalidatePath(`/admin-game/dashboard/aventures/${form.adventureId}`);
    return { success: true, id: result.id, message: "Trésor créée avec succès." };
} catch (e) {
    return {
    success: false,
    error: e instanceof Error ? e.message : "Impossible de créer un trésor.",
    };
}
}
    
