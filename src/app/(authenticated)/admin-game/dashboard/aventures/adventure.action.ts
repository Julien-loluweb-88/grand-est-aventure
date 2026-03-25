"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { Adventure } from "../../../../../../generated/prisma/browser";

const ADMIN_ROLES = ["admin", "superadmin"] as const;

export type CreateAdventureInput = {
  name: string;
  description: string;
  city: string;
  status?: boolean;
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

export async function listAdventures() {
  try {
    const adventures = await prisma.adventure.findMany();

    return {
      ok: true as const,
      adventures,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: "Erreur lors du chargement des aventures.",
    };
  }
} 

export type AdventureListItem = {
  id: string;
  name: string;
  city: string;
  status: boolean;
}

  export async function listAdventuresForAdmin(params: {
    page: number;
    pageSize: number;
    search: string;
  }): Promise<
    { ok: true; adventure: AdventureListItem[]; total: number } | { ok: false; error: string }
  > {
    const user = await getUser();
    if (!user || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
      return { ok: false, error: "Non autorisé." };
    }
  
    const skip = (params.page - 1) * params.pageSize;
    const q = params.search.trim();
  
    const where =
      q.length > 0
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { city: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {};
  
    try {
      const [adventure, total] = await Promise.all([
        prisma.adventure.findMany({
          where,
          select: {
            id: true,
            name: true,
            city: true,
            status: true,
    
          },
          orderBy: { name: "asc" },
          skip,
          take: params.pageSize,
        }),
        prisma.adventure.count({ where }),
      ]);
  
      return {
        ok: true,
        adventure: adventure.map((u) => ({
          id: u.id,
          name: u.name,
          city: u.city,
          status: u.status ?? false,
        })),
        total,
      };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur lors du chargement des aventures.",
      };
    }
  }



