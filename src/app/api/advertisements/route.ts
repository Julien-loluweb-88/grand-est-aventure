import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterEligibleAdvertisements } from "@/lib/advertisement-eligibility";
import { resolvePartnerBadgeImageUrl } from "@/lib/advertisements/resolve-partner-badge-image-url";

/**
 * Liste les publicités éligibles pour l’appli joueur.
 * Query : `placement` (obligatoire), `cityId`, `latitude`, `longitude`.
 * Ciblage : voir `filterEligibleAdvertisements` — villes (cityId dans la liste cible)
 * et/ou disque (lat+lon à distance ≤ rayon si centre + rayon configurés).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const placement = (searchParams.get("placement") ?? "").trim();
  if (!placement) {
    return NextResponse.json(
      { error: "Paramètre placement requis." },
      { status: 400 }
    );
  }

  const cityId = searchParams.get("cityId") ?? undefined;
  const latRaw = searchParams.get("latitude");
  const lonRaw = searchParams.get("longitude");
  let latitude: number | undefined;
  let longitude: number | undefined;
  if (latRaw != null && latRaw !== "") {
    latitude = Number(latRaw);
    if (!Number.isFinite(latitude)) {
      return NextResponse.json({ error: "latitude invalide." }, { status: 400 });
    }
  }
  if (lonRaw != null && lonRaw !== "") {
    longitude = Number(lonRaw);
    if (!Number.isFinite(longitude)) {
      return NextResponse.json({ error: "longitude invalide." }, { status: 400 });
    }
  }

  const now = new Date();

  const ads = await prisma.advertisement.findMany({
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

  const eligible = filterEligibleAdvertisements(
    ads,
    placement,
    now,
    cityId,
    latitude ?? null,
    longitude ?? null
  );

  return NextResponse.json({
    advertisements: eligible.map((a) => {
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
    }),
  });
}
