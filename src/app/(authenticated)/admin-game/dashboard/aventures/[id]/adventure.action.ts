"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getUser } from "@/lib/auth/auth-user";
import { canManageAdventure, isAdminRole } from "@/lib/admin-access";
import { roleHasAdventurePermission } from "@/lib/permissions";

export async function statusAdventure(id: string, status: boolean) {
    const user = await getUser();
    if (!user || !isAdminRole(user.role)) {
      throw new Error("Non autorisé.");
    }
    if (!roleHasAdventurePermission(user.role, "update")) {
      throw new Error("Non autorisé.");
    }
    if (!(await canManageAdventure({ userId: user.id, role: user.role, adventureId: id }))) {
      throw new Error("Non autorisé.");
    }
    return await prisma.adventure.update({
    where: { id },
    data: { status },
  });
}

export async function RemoveAdventure(adventureId: string) {
    const session = await auth.api.getSession({headers: await headers() });
    const user = session?.user
    if(!user || !isAdminRole(user.role)){
    return {
      success: false,
      message: "Vous n'avez pas le droit de supprimer des aventures.",
    };
  }
  if (!roleHasAdventurePermission(user.role, "delete")) {
    return{
       success: false,
      message: "Vous n'avez pas le droit de supprimer des aventures.",
    };
  }
  if (!(await canManageAdventure({ userId: user.id, role: user.role, adventureId }))) {
    return{
       success: false,
      message: "Vous n'avez pas le droit de supprimer des aventures.",
    }
  
  }

    try{
    await prisma.adventure.delete({
        where: {
            id: adventureId,
        },
    });
    revalidatePath("/admin-game/dashboard/aventures");
    return {
        success: true,
        message: "Aventure supprimée avec succès."
    };
} catch {
    return {
        success: false,
        message: "Erreur lors de la suppression."
};
}  
}