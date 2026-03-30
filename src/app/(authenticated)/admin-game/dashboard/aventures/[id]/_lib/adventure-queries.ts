import "server-only";

import { prisma } from "@/lib/prisma";
import { gateAdventureAction } from "@/lib/adventure-authorization";

/** Données aventure (hors server actions) — évite de mélanger requêtes et `"use server"`. */
export async function getAdventureById(id: string) {
  const gate = await gateAdventureAction(id, "read");
  if (!gate.ok) {
    return null;
  }

  return prisma.adventure.findUnique({
    where: { id },
    include: {
      city: true,
      treasure: true,
      enigmas: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          name: true,
          number: true,
          latitude: true,
          longitude: true,
        },
      },
      userAdventures: {
         where: { success: true },
         include: {
          user: true,
         }
      }
    },
  });
}

export type AdventureAdminDetail = NonNullable<Awaited<ReturnType<typeof getAdventureById>>>;
