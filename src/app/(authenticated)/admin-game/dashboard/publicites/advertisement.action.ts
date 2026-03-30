"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import { finalizeAdvertisementDraftImageUrl } from "@/lib/uploads/finalize-advertisement-draft-image";
import type { AdvertiserKind } from "../../../../../../generated/prisma/client";

export type AdvertisementFormInput = {
  name: string;
  advertiserKind: AdvertiserKind;
  advertiserName: string;
  title: string;
  body: string;
  imageUrl: string;
  targetUrl: string;
  placement: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  targetCenterLatitude: string;
  targetCenterLongitude: string;
  targetRadiusMeters: string;
  targetCityIds: string[];
  /** Brouillon téléversement image (création uniquement). */
  advertisementImageDraftId?: string | null;
};

function parseOptionalDate(s: string | null): Date | null {
  if (s == null || !String(s).trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseOptionalFloat(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

async function assertCanMutateAds() {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!(await userHasPermissionServer({ permissions: { adventure: ["update"] } }))) {
    return { ok: false as const, error: "Non autorisé." };
  }
  return { ok: true as const, actor };
}

export async function createAdvertisement(
  input: AdvertisementFormInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const gate = await assertCanMutateAds();
  if (!gate.ok) return { success: false, error: gate.error };

  const title = input.title.trim() || null;
  const body = input.body.trim() || null;
  let imageUrl = input.imageUrl.trim() || null;
  const targetUrl = input.targetUrl.trim() || null;
  const placement = input.placement.trim() || "home";

  const lat = parseOptionalFloat(input.targetCenterLatitude);
  const lon = parseOptionalFloat(input.targetCenterLongitude);
  const radius = parseOptionalInt(input.targetRadiusMeters);
  const hasCenter = lat != null && lon != null && radius != null;
  const hasPartialCenter =
    input.targetCenterLatitude.trim() ||
    input.targetCenterLongitude.trim() ||
    input.targetRadiusMeters.trim();
  if (hasPartialCenter && !hasCenter) {
    return {
      success: false,
      error:
        "Ciblage par zone : renseignez les trois champs (latitude, longitude, rayon en mètres) ou laissez-les vides.",
    };
  }

  const uniqueCityIds = [...new Set(input.targetCityIds.filter(Boolean))];
  if (uniqueCityIds.length > 0) {
    const n = await prisma.city.count({ where: { id: { in: uniqueCityIds } } });
    if (n !== uniqueCityIds.length) {
      return { success: false, error: "Une ou plusieurs villes cibles sont invalides." };
    }
  }

  try {
    const row = await prisma.advertisement.create({
      data: {
        name: input.name.trim(),
        advertiserKind: input.advertiserKind,
        advertiserName: input.advertiserName.trim(),
        title,
        body,
        imageUrl: imageUrl ?? undefined,
        targetUrl,
        placement,
        active: input.active,
        startsAt: parseOptionalDate(input.startsAt),
        endsAt: parseOptionalDate(input.endsAt),
        sortOrder: input.sortOrder,
        targetCenterLatitude: hasCenter ? lat : null,
        targetCenterLongitude: hasCenter ? lon : null,
        targetRadiusMeters: hasCenter ? radius : null,
        targetCities:
          uniqueCityIds.length > 0
            ? { connect: uniqueCityIds.map((id) => ({ id })) }
            : undefined,
      },
    });

    const draftId = input.advertisementImageDraftId?.trim();
    if (draftId && imageUrl) {
      const finalUrl = await finalizeAdvertisementDraftImageUrl({
        draftId,
        advertisementId: row.id,
        imageUrl,
      });
      if (finalUrl && finalUrl !== imageUrl) {
        imageUrl = finalUrl;
        await prisma.advertisement.update({
          where: { id: row.id },
          data: { imageUrl: finalUrl },
        });
      }
    }

    revalidatePath("/admin-game/dashboard/publicites");
    return { success: true, id: row.id };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Impossible de créer la publicité.",
    };
  }
}

export async function updateAdvertisement(
  id: string,
  input: AdvertisementFormInput
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await assertCanMutateAds();
  if (!gate.ok) return { success: false, error: gate.error };

  const exists = await prisma.advertisement.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    return { success: false, error: "Publicité introuvable." };
  }

  const title = input.title.trim() || null;
  const body = input.body.trim() || null;
  const imageUrl = input.imageUrl.trim() || null;
  const targetUrl = input.targetUrl.trim() || null;
  const placement = input.placement.trim() || "home";

  const lat = parseOptionalFloat(input.targetCenterLatitude);
  const lon = parseOptionalFloat(input.targetCenterLongitude);
  const radius = parseOptionalInt(input.targetRadiusMeters);
  const hasCenter = lat != null && lon != null && radius != null;
  const hasPartialCenter =
    input.targetCenterLatitude.trim() ||
    input.targetCenterLongitude.trim() ||
    input.targetRadiusMeters.trim();
  if (hasPartialCenter && !hasCenter) {
    return {
      success: false,
      error:
        "Ciblage par zone : renseignez les trois champs (latitude, longitude, rayon en mètres) ou laissez-les vides.",
    };
  }

  const uniqueCityIds = [...new Set(input.targetCityIds.filter(Boolean))];
  if (uniqueCityIds.length > 0) {
    const n = await prisma.city.count({ where: { id: { in: uniqueCityIds } } });
    if (n !== uniqueCityIds.length) {
      return { success: false, error: "Une ou plusieurs villes cibles sont invalides." };
    }
  }

  try {
    await prisma.advertisement.update({
      where: { id },
      data: {
        name: input.name.trim(),
        advertiserKind: input.advertiserKind,
        advertiserName: input.advertiserName.trim(),
        title,
        body,
        imageUrl,
        targetUrl,
        placement,
        active: input.active,
        startsAt: parseOptionalDate(input.startsAt),
        endsAt: parseOptionalDate(input.endsAt),
        sortOrder: input.sortOrder,
        targetCenterLatitude: hasCenter ? lat : null,
        targetCenterLongitude: hasCenter ? lon : null,
        targetRadiusMeters: hasCenter ? radius : null,
        targetCities: {
          set: uniqueCityIds.map((cid) => ({ id: cid })),
        },
      },
    });
    revalidatePath("/admin-game/dashboard/publicites");
    revalidatePath(`/admin-game/dashboard/publicites/${id}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Impossible de mettre à jour la publicité.",
    };
  }
}

export async function deleteAdvertisement(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await assertCanMutateAds();
  if (!gate.ok) return { success: false, error: gate.error };

  try {
    await prisma.advertisement.delete({ where: { id } });
    revalidatePath("/admin-game/dashboard/publicites");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de supprimer la publicité." };
  }
}
