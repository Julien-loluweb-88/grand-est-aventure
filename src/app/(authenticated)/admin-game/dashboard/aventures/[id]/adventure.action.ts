"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { toast } from "sonner";

export async function getAdventureById(id: string) {
    const adventure = await prisma.adventure.findUnique({
        where: {id}
    });
   return adventure
}

export async function RemoveAdventure(adventureId: string) {
    try{
    await prisma.adventure.delete({
        where: {
            id: adventureId,
        },
    });
    revalidatePath("/admin-game/dashboard/aventures");
    return {
        success: true,
        message: toast.success("Aventure a été supprimé")
    };
} catch (error){
    return {
        success: false,
        message: toast.error("Erreur lors de la suppression.")
};
}  
}