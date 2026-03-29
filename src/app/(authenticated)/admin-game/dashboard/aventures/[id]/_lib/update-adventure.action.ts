"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { CreateAdventureInput } from "../../adventure.action";
import { gateAdventureUpdateContent } from "@/lib/adventure-authorization";
import { syncAdventureRouteDistance } from "@/lib/adventure-route-distance";
import { deleteUploadsFileByUrl } from "@/lib/uploads/delete-uploads-file";

/** Action isolée : évite de regrouper toutes les mutations avec la page RSC. */
export async function updateAdventure(
  id: string,
  form: CreateAdventureInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(id);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    const prev = await prisma.adventure.findUnique({
      where: { id },
      select: { coverImageUrl: true, badgeImageUrl: true },
    });

    const result = await prisma.adventure.update({
      where: { id },
      data: {
        name: form.name,
        description: form.description,
        city: form.city,
        latitude: form.latitude,
        longitude: form.longitude,
        coverImageUrl: form.coverImageUrl?.trim() || null,
        badgeImageUrl: form.badgeImageUrl?.trim() || null,
      },
    });

    const nextCover = form.coverImageUrl?.trim() || null;
    const nextBadge = form.badgeImageUrl?.trim() || null;
    if (prev?.coverImageUrl && prev.coverImageUrl !== nextCover) {
      await deleteUploadsFileByUrl(prev.coverImageUrl);
    }
    if (prev?.badgeImageUrl && prev.badgeImageUrl !== nextBadge) {
      await deleteUploadsFileByUrl(prev.badgeImageUrl);
    }

    await syncAdventureRouteDistance(id);
    revalidatePath("/admin-game/dashboard/aventures");
    revalidatePath(`/admin-game/dashboard/aventures/${id}`);
    return { success: true, id: result.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de mettre à jour l’aventure.",
    };
  }
}
