import "server-only";

/** Visuel affichable pour un badge partenaire : image dédiée ou, à défaut, image de l’encart. */
export function resolvePartnerBadgeImageUrl(params: {
  advertisementImageUrl: string | null | undefined;
  badgeDefinitionImageUrl: string | null | undefined;
}): string | null {
  const fromBadge = params.badgeDefinitionImageUrl?.trim() ?? "";
  if (fromBadge.length > 0) return fromBadge;
  const fromAd = params.advertisementImageUrl?.trim() ?? "";
  return fromAd.length > 0 ? fromAd : null;
}
