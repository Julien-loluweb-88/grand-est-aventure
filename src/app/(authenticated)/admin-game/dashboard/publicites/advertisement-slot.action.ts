"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  assertSuperadminForAdvertisements,
  countMerchantOwnedSlots,
  getMerchantAdvertisementQuota,
} from "@/lib/advertisements/merchant-advertisement-authorization";
import { AdvertisementMerchantContentStatus } from "@/lib/badges/prisma-enums";
import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { ADVERTISEMENT_PARTNER_BADGE_TITLE_MAX_CHARS } from "@/lib/dashboard-text-limits";
import { isAdvertisementPlacement } from "@/lib/advertisements/advertisement-placements";
import type { AdvertiserKind } from "../../../../../../generated/prisma/client";

export type AdvertisementSlotFormInput = {
  name: string;
  advertiserKind: AdvertiserKind;
  advertiserName: string;
  placement: string;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  targetCenterLatitude: string;
  targetCenterLongitude: string;
  targetRadiusMeters: string;
  targetCityIds: string[];
  ownerMerchantUserId: string;
  partnerBadgeTitle: string;
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

export async function createMerchantAdvertisementSlot(
  input: AdvertisementSlotFormInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const gate = await assertSuperadminForAdvertisements();
  if (!gate.ok) return { success: false, error: gate.error };

  const merchantId = input.ownerMerchantUserId.trim();
  if (!merchantId) {
    return { success: false, error: "Commerçant requis." };
  }

  const merchant = await prisma.user.findFirst({
    where: { id: merchantId, role: "merchant" },
    select: { id: true, merchantMaxAdvertisementSlots: true },
  });
  if (!merchant) {
    return { success: false, error: "Commerçant invalide." };
  }

  const quota = merchant.merchantMaxAdvertisementSlots;
  if (quota == null || quota < 1) {
    return {
      success: false,
      error:
        "Définissez d'abord un quota d'emplacements sur la fiche du commerçant.",
    };
  }
  const used = await countMerchantOwnedSlots(merchantId);
  if (used >= quota) {
    return {
      success: false,
      error: `Quota atteint (${used}/${quota} emplacements).`,
    };
  }

  const placementRaw = input.placement.trim();
  if (!isAdvertisementPlacement(placementRaw)) {
    return { success: false, error: "Placement invalide." };
  }

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
        placement: placementRaw,
        active: false,
        startsAt: parseOptionalDate(input.startsAt),
        endsAt: parseOptionalDate(input.endsAt),
        sortOrder: input.sortOrder,
        targetCenterLatitude: hasCenter ? lat : null,
        targetCenterLongitude: hasCenter ? lon : null,
        targetRadiusMeters: hasCenter ? radius : null,
        ownerMerchantUserId: merchantId,
        merchantContentStatus: AdvertisementMerchantContentStatus.SLOT_EMPTY,
        targetCities:
          uniqueCityIds.length > 0
            ? { connect: uniqueCityIds.map((id) => ({ id })) }
            : undefined,
      },
    });

    await prisma.merchantAdvertisement.upsert({
      where: {
        userId_advertisementId: {
          userId: merchantId,
          advertisementId: row.id,
        },
      },
      create: { userId: merchantId, advertisementId: row.id },
      update: {},
    });

    const badgeTitle = input.partnerBadgeTitle.trim().slice(0, ADVERTISEMENT_PARTNER_BADGE_TITLE_MAX_CHARS);
    if (badgeTitle) {
      const bd = await prisma.badgeDefinition.create({
        data: {
          slug: `partner-ad-${row.id}`,
          title: badgeTitle,
          kind: BadgeDefinitionKind.PARTNER_OFFER,
          sortOrder: 100,
        },
      });
      await prisma.advertisement.update({
        where: { id: row.id },
        data: { partnerBadgeDefinitionId: bd.id },
      });
    }

    revalidatePath("/admin-game/dashboard/publicites");
    revalidatePath("/admin-game/dashboard/commercant");
    return { success: true, id: row.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer l'emplacement.",
    };
  }
}

export async function updateMerchantAdvertisementQuota(
  userId: string,
  maxSlots: number | null
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await assertSuperadminForAdvertisements();
  if (!gate.ok) return { success: false, error: gate.error };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "merchant") {
    return { success: false, error: "Utilisateur commerçant introuvable." };
  }

  if (maxSlots != null) {
    if (!Number.isInteger(maxSlots) || maxSlots < 0 || maxSlots > 100) {
      return { success: false, error: "Quota invalide (0 à 100)." };
    }
    const used = await countMerchantOwnedSlots(userId);
    if (maxSlots < used) {
      return {
        success: false,
        error: `Quota inférieur au nombre d'emplacements déjà créés (${used}).`,
      };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { merchantMaxAdvertisementSlots: maxSlots },
  });

  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
  return { success: true };
}

export async function getMerchantQuotaSummary(userId: string) {
  const gate = await assertSuperadminForAdvertisements();
  if (!gate.ok) return null;
  return getMerchantAdvertisementQuota(userId);
}
