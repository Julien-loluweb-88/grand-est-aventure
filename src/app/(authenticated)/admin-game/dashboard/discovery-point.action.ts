"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getAdminActorForAuthorization,
  gateAdventureUpdateContent,
} from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { allocateUniqueMilestoneBadgeSlug } from "@/lib/badges/slugify-milestone-badge";
import {
  DISCOVERY_POINT_TEASER_MAX_CHARS,
  DISCOVERY_POINT_TITLE_MAX_CHARS,
} from "@/lib/dashboard-text-limits";

async function assertCanMutateCityScopedDiscovery(): Promise<boolean> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return false;
  return userHasPermissionServer({ permissions: { adventure: ["update"] } });
}

async function loadPointForGate(id: string) {
  return prisma.discoveryPoint.findUnique({
    where: { id },
    select: { id: true, adventureId: true, cityId: true },
  });
}

async function assertCanMutatePoint(pointId: string): Promise<boolean> {
  const p = await loadPointForGate(pointId);
  if (!p) return false;
  if (p.adventureId) {
    const g = await gateAdventureUpdateContent(p.adventureId);
    return g.ok;
  }
  return assertCanMutateCityScopedDiscovery();
}

export async function createDiscoveryPoint(input: {
  cityId: string;
  adventureId: string | null;
  title: string;
  teaser: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  sortOrder: number;
  imageUrl: string;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const title = input.title.trim();
  if (title.length < 1 || title.length > DISCOVERY_POINT_TITLE_MAX_CHARS) {
    return {
      success: false,
      error: `Titre invalide (1–${DISCOVERY_POINT_TITLE_MAX_CHARS} caractères).`,
    };
  }
  const teaserTrimmed = input.teaser.trim();
  if (teaserTrimmed.length > DISCOVERY_POINT_TEASER_MAX_CHARS) {
    return {
      success: false,
      error: `Accroche trop longue (${DISCOVERY_POINT_TEASER_MAX_CHARS} caractères maximum).`,
    };
  }
  const teaser = teaserTrimmed.length > 0 ? teaserTrimmed : null;
  const lat = Number(input.latitude);
  const lon = Number(input.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { success: false, error: "Latitude / longitude invalides." };
  }
  let radius = Math.floor(Number(input.radiusMeters));
  if (!Number.isFinite(radius) || radius < 5 || radius > 2000) {
    return { success: false, error: "Rayon : entre 5 et 2000 m." };
  }
  let sortOrder = Math.floor(Number(input.sortOrder));
  if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 999_999) {
    return { success: false, error: "Ordre invalide." };
  }
  const imageUrl = input.imageUrl.trim() || null;

  let cityId = input.cityId.trim();
  let adventureId: string | null = input.adventureId?.trim() || null;

  if (adventureId) {
    const g = await gateAdventureUpdateContent(adventureId);
    if (!g.ok) return { success: false, error: "Non autorisé." };
    const adv = await prisma.adventure.findUnique({
      where: { id: adventureId },
      select: { cityId: true, status: true },
    });
    if (!adv || adv.status === false) {
      return { success: false, error: "Aventure introuvable ou inactive." };
    }
    cityId = adv.cityId;
  } else {
    if (!(await assertCanMutateCityScopedDiscovery())) {
      return { success: false, error: "Non autorisé." };
    }
    const city = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
    if (!city) {
      return { success: false, error: "Ville introuvable." };
    }
  }

  try {
    const slug = await allocateUniqueMilestoneBadgeSlug(title);
    const row = await prisma.$transaction(async (tx) => {
      const point = await tx.discoveryPoint.create({
        data: {
          cityId,
          adventureId,
          title,
          teaser,
          latitude: lat,
          longitude: lon,
          radiusMeters: radius,
          sortOrder,
          imageUrl,
        },
        select: { id: true },
      });
      await tx.badgeDefinition.create({
        data: {
          slug,
          title,
          kind: BadgeDefinitionKind.DISCOVERY,
          discoveryPointId: point.id,
          imageUrl,
          sortOrder,
        },
      });
      return point;
    });
    revalidatePath("/admin-game/dashboard/villes");
    revalidatePath(`/admin-game/dashboard/villes/${cityId}`);
    revalidatePath("/admin-game/dashboard/aventures");
    if (adventureId) {
      revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    }
    return { success: true, id: row.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer le point.",
    };
  }
}

export async function updateDiscoveryPoint(
  pointId: string,
  input: {
    title: string;
    teaser: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    sortOrder: number;
    imageUrl: string;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  if (!(await assertCanMutatePoint(pointId))) {
    return { success: false, error: "Non autorisé." };
  }

  const title = input.title.trim();
  if (title.length < 1 || title.length > DISCOVERY_POINT_TITLE_MAX_CHARS) {
    return {
      success: false,
      error: `Titre invalide (1–${DISCOVERY_POINT_TITLE_MAX_CHARS} caractères).`,
    };
  }
  const teaserTrimmed = input.teaser.trim();
  if (teaserTrimmed.length > DISCOVERY_POINT_TEASER_MAX_CHARS) {
    return {
      success: false,
      error: `Accroche trop longue (${DISCOVERY_POINT_TEASER_MAX_CHARS} caractères maximum).`,
    };
  }
  const teaser = teaserTrimmed.length > 0 ? teaserTrimmed : null;
  const lat = Number(input.latitude);
  const lon = Number(input.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { success: false, error: "Latitude / longitude invalides." };
  }
  let radius = Math.floor(Number(input.radiusMeters));
  if (!Number.isFinite(radius) || radius < 5 || radius > 2000) {
    return { success: false, error: "Rayon : entre 5 et 2000 m." };
  }
  let sortOrder = Math.floor(Number(input.sortOrder));
  if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 999_999) {
    return { success: false, error: "Ordre invalide." };
  }
  const imageUrl = input.imageUrl.trim() || null;

  const point = await prisma.discoveryPoint.findUnique({
    where: { id: pointId },
    select: {
      id: true,
      cityId: true,
      adventureId: true,
      badgeDefinition: { select: { id: true } },
    },
  });
  if (!point?.badgeDefinition) {
    return { success: false, error: "Point introuvable." };
  }

  const badgeDefinitionId = point.badgeDefinition.id;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.discoveryPoint.update({
        where: { id: pointId },
        data: {
          title,
          teaser,
          latitude: lat,
          longitude: lon,
          radiusMeters: radius,
          sortOrder,
          imageUrl,
        },
      });
      await tx.badgeDefinition.update({
        where: { id: badgeDefinitionId },
        data: { title, imageUrl, sortOrder },
      });
    });
    revalidatePath("/admin-game/dashboard/villes");
    revalidatePath(`/admin-game/dashboard/villes/${point.cityId}`);
    revalidatePath("/admin-game/dashboard/aventures");
    if (point.adventureId) {
      revalidatePath(`/admin-game/dashboard/aventures/${point.adventureId}`);
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de mettre à jour.",
    };
  }
}

export async function deleteDiscoveryPoint(
  pointId: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!(await assertCanMutatePoint(pointId))) {
    return { success: false, error: "Non autorisé." };
  }

  const point = await prisma.discoveryPoint.findUnique({
    where: { id: pointId },
    select: { id: true, cityId: true, adventureId: true },
  });
  if (!point) {
    return { success: false, error: "Point introuvable." };
  }

  try {
    await prisma.discoveryPoint.delete({ where: { id: pointId } });
    revalidatePath("/admin-game/dashboard/villes");
    revalidatePath(`/admin-game/dashboard/villes/${point.cityId}`);
    revalidatePath("/admin-game/dashboard/aventures");
    if (point.adventureId) {
      revalidatePath(`/admin-game/dashboard/aventures/${point.adventureId}`);
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de supprimer.",
    };
  }
}
