"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/auth-user";
import type { CreateAdventureInput } from "../adventure.action";
import { canManageAdventure, isAdminRole } from "@/lib/admin-access";
import { roleHasAdventurePermission } from "@/lib/permissions";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";

/** Action isolée : évite de regrouper toutes les mutations avec la page RSC. */
export async function updateAdventure(
  id: string,
  form: CreateAdventureInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { success: false, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "update")) {
    return { success: false, error: "Non autorisé." };
  }
  if (!(await canManageAdventure({ userId: user.id, role: user.role, adventureId: id }))) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    const result = await prisma.adventure.update({
      where: { id },
      data: {
        name: form.name,
        description: form.description,
        city: form.city,
        latitude: form.latitude,
        longitude: form.longitude,
      },
    });
    await syncAdventureRouteDistance(id);
    revalidatePath("/admin-game/dashboard/aventures");
    revalidatePath(`/admin-game/dashboard/aventures/${id}`);
    return { success: true, id: result.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l’aventure.",
    };
  }
}
