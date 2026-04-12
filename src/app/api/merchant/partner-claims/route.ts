import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PartnerOfferClaimStatus } from "../../../../../generated/prisma/client";
import { resolvePartnerBadgeImageUrl } from "@/lib/advertisements/resolve-partner-badge-image-url";

/**
 * Liste des demandes d’offres pour les publicités gérées par le commerçant connecté.
 * Client attendu : **app mobile** (session cookie / headers Better Auth comme le jeu).
 * Query : `status` (optionnel, défaut `PENDING`).
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (session.user.role !== "merchant") {
    return NextResponse.json({ error: "Réservé aux comptes commerçant." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusRaw = (searchParams.get("status") ?? "PENDING").trim().toUpperCase();
  const status =
    statusRaw === "APPROVED" ||
    statusRaw === "REJECTED" ||
    statusRaw === "EXPIRED" ||
    statusRaw === "PENDING"
      ? (statusRaw as PartnerOfferClaimStatus)
      : PartnerOfferClaimStatus.PENDING;

  const assignments = await prisma.merchantAdvertisement.findMany({
    where: { userId: session.user.id },
    select: { advertisementId: true },
  });
  const adIds = assignments.map((a) => a.advertisementId);
  if (adIds.length === 0) {
    return NextResponse.json({ claims: [] });
  }

  const claims = await prisma.partnerOfferClaim.findMany({
    where: {
      advertisementId: { in: adIds },
      status,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      advertisement: {
        select: {
          id: true,
          advertiserName: true,
          title: true,
          name: true,
          imageUrl: true,
          partnerBadgeDefinition: { select: { title: true, imageUrl: true } },
        },
      },
    },
  });

  return NextResponse.json({
    claims: claims.map((c) => {
      const ad = c.advertisement;
      const badgeImageUrl = resolvePartnerBadgeImageUrl({
        advertisementImageUrl: ad.imageUrl,
        badgeDefinitionImageUrl: ad.partnerBadgeDefinition?.imageUrl,
      });
      return {
        id: c.id,
        advertisementId: c.advertisementId,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString() ?? null,
        rejectionReason: c.rejectionReason,
        player: {
          id: c.user.id,
          name: c.user.name,
          email: c.user.email,
        },
        advertisement: {
          id: ad.id,
          name: ad.name,
          advertiserName: ad.advertiserName,
          title: ad.title,
          badgeTitle: ad.partnerBadgeDefinition?.title ?? null,
          badgeImageUrl,
        },
      };
    }),
  });
}
