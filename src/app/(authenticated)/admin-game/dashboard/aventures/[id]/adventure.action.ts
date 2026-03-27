"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getUser } from "@/lib/auth/auth-user";
import { CreateAdventureInput } from "../adventure.action";

const ADMIN_ROLES = ["admin", "superadmin"] as const;

export async function getAdventureById(id: string) {
    const adventure = await prisma.adventure.findUnique({
        where: {id}
    });
   return adventure
}

export async function statusAdventure(id: string, status: boolean) {
    const user = await getUser();
    if (!user || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
      throw new Error("Non autorisé.");
    }
    return await prisma.adventure.update({
    where: { id },
    data: { status },
  });
}

export async function updateAdventure(
  id: string,
  form: CreateAdventureInput
  ): Promise<{ success: true; id: string } | { success: false; error: string }> {
    const user = await getUser();
    if (!user || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
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
          distance: form.distance,
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

export async function RemoveAdventure(adventureId: string) {
    const session = await auth.api.getSession({headers: await headers() });
    const user = session?.user
    if(!user){
    return {
      success: false,
      message: "Vous n'avez pas le droit de supprimer des aventures.",
    };
  }
  const { success: canDelete } = await auth.api.userHasPermission({
    body: {
      userId: user.id,
      permissions: {
        user: ["delete"],
      },
    },
  });
  if(!canDelete){
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
} catch (error){
    return {
        success: false,
        message: "Erreur lors de la suppression."
};
}  
}