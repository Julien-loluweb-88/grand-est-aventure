"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { getManagedAdventureIds, isSuperadmin } from "@/lib/admin-access";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";

export type CityFormInput = {
  name: string;
  inseeCode: string;
  postalCodesRaw: string;
  latitude: string;
  longitude: string;
  population: string;
};

function parsePostalCodes(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function optionalFloat(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function optionalInt(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

export type CityAdventureListItem = {
  id: string;
  name: string;
  status: boolean;
};

/** Aventures d’une ville visibles par l’admin (périmètre géré si non superadmin). */
export async function listAdventuresForCityAdmin(cityId: string): Promise<
  | { ok: true; adventures: CityAdventureListItem[] }
  | { ok: false; error: string }
> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { ok: false, error: "Non autorisé." };
  }
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return { ok: false, error: "Non autorisé." };
  }

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    select: { id: true },
  });
  if (!city) {
    return { ok: false, error: "Ville introuvable." };
  }

  const managedIds = isSuperadmin(actor.role)
    ? null
    : await getManagedAdventureIds(actor.id);

  if (managedIds !== null && managedIds.length === 0) {
    return { ok: true, adventures: [] };
  }

  const where =
    managedIds === null
      ? { cityId }
      : { cityId, id: { in: managedIds } };

  try {
    const rows = await prisma.adventure.findMany({
      where,
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    });
    return {
      ok: true,
      adventures: rows.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status ?? false,
      })),
    };
  } catch {
    return { ok: false, error: "Erreur lors du chargement des aventures." };
  }
}

function normalizeInsee(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^\d{5}$/.test(t)) {
    throw new Error("Code INSEE : 5 chiffres ou laissez vide.");
  }
  return t;
}

export async function createCity(
  form: CityFormInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return { success: false, error: "Non autorisé." };
  if (!(await userHasPermissionServer({ permissions: { adventure: ["update"] } }))) {
    return { success: false, error: "Non autorisé." };
  }

  const name = form.name.trim();
  if (name.length < 2) {
    return { success: false, error: "Le nom doit contenir au moins 2 caractères." };
  }

  try {
    let inseeCode: string | null = null;
    try {
      inseeCode = normalizeInsee(form.inseeCode);
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Code INSEE invalide.",
      };
    }

    if (inseeCode) {
      const taken = await prisma.city.findUnique({
        where: { inseeCode },
        select: { id: true },
      });
      if (taken) {
        return { success: false, error: "Ce code INSEE est déjà utilisé." };
      }
    }

    const row = await prisma.city.create({
      data: {
        name,
        inseeCode,
        postalCodes: parsePostalCodes(form.postalCodesRaw),
        latitude: optionalFloat(form.latitude),
        longitude: optionalFloat(form.longitude),
        population: optionalInt(form.population),
      },
    });
    revalidatePath("/admin-game/dashboard/villes");
    revalidatePath("/admin-game/dashboard/aventures/create");
    return { success: true, id: row.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer la ville.",
    };
  }
}

export async function updateCity(
  id: string,
  form: CityFormInput
): Promise<{ success: true } | { success: false; error: string }> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return { success: false, error: "Non autorisé." };
  if (!(await userHasPermissionServer({ permissions: { adventure: ["update"] } }))) {
    return { success: false, error: "Non autorisé." };
  }

  const name = form.name.trim();
  if (name.length < 2) {
    return { success: false, error: "Le nom doit contenir au moins 2 caractères." };
  }

  try {
    let inseeCode: string | null = null;
    try {
      inseeCode = normalizeInsee(form.inseeCode);
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Code INSEE invalide.",
      };
    }

    if (inseeCode) {
      const taken = await prisma.city.findFirst({
        where: { inseeCode, NOT: { id } },
        select: { id: true },
      });
      if (taken) {
        return { success: false, error: "Ce code INSEE est déjà utilisé." };
      }
    }

    await prisma.city.update({
      where: { id },
      data: {
        name,
        inseeCode,
        postalCodes: parsePostalCodes(form.postalCodesRaw),
        latitude: optionalFloat(form.latitude),
        longitude: optionalFloat(form.longitude),
        population: optionalInt(form.population),
      },
    });
    revalidatePath("/admin-game/dashboard/villes");
    revalidatePath(`/admin-game/dashboard/villes/${id}`);
    revalidatePath("/admin-game/dashboard/aventures/create");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de mettre à jour la ville.",
    };
  }
}

export async function deleteCity(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return { success: false, error: "Non autorisé." };
  if (!(await userHasPermissionServer({ permissions: { adventure: ["update"] } }))) {
    return { success: false, error: "Non autorisé." };
  }

  try {
    const count = await prisma.adventure.count({ where: { cityId: id } });
    if (count > 0) {
      return {
        success: false,
        error: `Impossible de supprimer : ${count} aventure(s) utilisent encore cette ville.`,
      };
    }
    await prisma.city.delete({ where: { id } });
    revalidatePath("/admin-game/dashboard/villes");
    revalidatePath("/admin-game/dashboard/aventures/create");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de supprimer la ville.",
    };
  }
}
