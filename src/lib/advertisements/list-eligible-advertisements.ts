import "server-only";

import { prisma } from "@/lib/prisma";
import { filterEligibleAdvertisements, type AdWithTargets } from "@/lib/advertisement-eligibility";
import { resolvePartnerBadgeImageUrl } from "@/lib/advertisements/resolve-partner-badge-image-url";
import {
  resolveCityFromCoordinates,
  type CityResolveSource,
} from "@/lib/geo/resolve-city-from-coordinates";

export type MobileAdvertisementItem = {
  id: string;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  advertiserName: string;
  sortOrder: number;
  partnerOffer: {
    open: boolean;
    maxRedemptionsPerUser: number;
    badgeTitle: string | null;
    badgeImageUrl: string | null;
  } | null;
};

export type AdvertisementLocationContext = {
  cityId: string | null;
  cityName: string | null;
  /** `insee` = API Gouv + match référentiel ; `nearest` = repli catalogue ; `null` = pas de ville inférée. */
  source: CityResolveSource | null;
};

export type ListEligibleAdvertisementsResult = {
  advertisements: MobileAdvertisementItem[];
  locationContext: AdvertisementLocationContext;
};

export type ListEligibleAdvertisementsParams = {
  placement: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Override explicite (ex. écran filtré par ville). */
  cityId?: string | null;
  userId?: string | null;
  /** Si true et pas de `cityId`, infère la ville depuis lat/lon (défaut true). */
  inferCityFromCoordinates?: boolean;
};

function emptyLocationContext(): AdvertisementLocationContext {
  return { cityId: null, cityName: null, source: null };
}

function serializeAdvertisement(a: AdWithTargets): MobileAdvertisementItem {
  const badgeImageUrl = resolvePartnerBadgeImageUrl({
    advertisementImageUrl: a.imageUrl,
    badgeDefinitionImageUrl: a.partnerBadgeDefinition?.imageUrl,
  });

  return {
    id: a.id,
    title: a.title,
    body: a.body,
    imageUrl: a.imageUrl,
    targetUrl: a.targetUrl,
    advertiserName: a.advertiserName,
    sortOrder: a.sortOrder,
    partnerOffer:
      a.partnerBadgeDefinitionId == null
        ? null
        : {
            open: a.partnerClaimsOpen,
            maxRedemptionsPerUser: a.partnerMaxRedemptionsPerUser,
            badgeTitle: a.partnerBadgeDefinition?.title ?? null,
            badgeImageUrl,
          },
  };
}

async function loadActiveAdvertisements(placement: string, now: Date) {
  return prisma.advertisement.findMany({
    where: {
      active: true,
      placement,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: {
      targetCities: { select: { id: true } },
      partnerBadgeDefinition: { select: { title: true, imageUrl: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

async function resolveCityIdForTargeting(
  params: ListEligibleAdvertisementsParams
): Promise<AdvertisementLocationContext> {
  const explicitCityId = params.cityId?.trim() || null;
  if (explicitCityId) {
    const city = await prisma.city.findUnique({
      where: { id: explicitCityId },
      select: { id: true, name: true },
    });
    if (city) {
      return { cityId: city.id, cityName: city.name, source: null };
    }
    return emptyLocationContext();
  }

  const infer = params.inferCityFromCoordinates !== false;
  const lat = params.latitude;
  const lon = params.longitude;
  if (!infer || lat == null || lon == null) {
    return emptyLocationContext();
  }

  const resolved = await resolveCityFromCoordinates(lat, lon);
  if (!resolved) {
    return emptyLocationContext();
  }

  return {
    cityId: resolved.cityId,
    cityName: resolved.cityName,
    source: resolved.source,
  };
}

/**
 * Pubs éligibles pour un emplacement (`home`, `library`, …).
 * Ciblage : dates, villes (cityId explicite ou inféré GPS), disque lat/lon/rayon.
 * Exclut les encarts masqués si `userId` fourni.
 */
export async function listEligibleAdvertisements(
  params: ListEligibleAdvertisementsParams
): Promise<ListEligibleAdvertisementsResult> {
  const placement = params.placement.trim();
  const now = new Date();

  const [ads, locationContext] = await Promise.all([
    loadActiveAdvertisements(placement, now),
    resolveCityIdForTargeting(params),
  ]);

  const eligible = filterEligibleAdvertisements(
    ads,
    placement,
    now,
    locationContext.cityId,
    params.latitude ?? null,
    params.longitude ?? null
  );

  let visible = eligible;
  if (params.userId) {
    const rows = await prisma.userAdvertisementDismissal.findMany({
      where: { userId: params.userId },
      select: { advertisementId: true },
    });
    const dismissedIds = new Set(rows.map((r) => r.advertisementId));
    if (dismissedIds.size > 0) {
      visible = eligible.filter((a) => !dismissedIds.has(a.id));
    }
  }

  return {
    advertisements: visible.map(serializeAdvertisement),
    locationContext,
  };
}
