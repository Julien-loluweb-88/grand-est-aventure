import type { Advertisement, City } from "../../generated/prisma/client";
import { haversineMeters } from "@/lib/geo/haversine-meters";

type AdWithTargets = Advertisement & {
  targetCities: Pick<City, "id">[];
  partnerBadgeDefinition?: { title: string; imageUrl: string | null } | null;
};

/**
 * Filtre les pubs actives + placement + fenêtre temporelle + ciblage géographique.
 * @param cityId — id `City` du référentiel si connu (joueur rattaché à une ville).
 * @param latitude / longitude — position pour le disque `targetRadiusMeters` (optionnel).
 */
export function filterEligibleAdvertisements(
  ads: AdWithTargets[],
  placement: string,
  now: Date,
  cityId: string | null | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined
): AdWithTargets[] {
  const p = placement.trim();
  return ads.filter((ad) => {
    if (!ad.active || ad.placement !== p) return false;
    if (ad.startsAt && now < ad.startsAt) return false;
    if (ad.endsAt && now > ad.endsAt) return false;

    const cityTargets = ad.targetCities;
    if (cityTargets.length > 0) {
      if (!cityId || !cityTargets.some((c) => c.id === cityId)) return false;
    }

    const hasDisk =
      ad.targetCenterLatitude != null &&
      ad.targetCenterLongitude != null &&
      ad.targetRadiusMeters != null;

    if (hasDisk) {
      if (latitude == null || longitude == null) return false;
      const d = haversineMeters(
        latitude,
        longitude,
        ad.targetCenterLatitude!,
        ad.targetCenterLongitude!
      );
      if (d > ad.targetRadiusMeters!) return false;
    }

    return true;
  });
}
