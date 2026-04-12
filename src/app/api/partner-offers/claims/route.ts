import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import { PartnerOfferClaimStatus } from "../../../../../generated/prisma/client";
import { createPartnerOfferClaim } from "@/lib/partner-offers/partner-offer-claims";
import { resolvePartnerBadgeImageUrl } from "@/lib/advertisements/resolve-partner-badge-image-url";

const CREATE_WINDOW_MS = 60_000;
const CREATE_MAX_PER_WINDOW = 15;
const LIST_WINDOW_MS = 60_000;
const LIST_MAX_PER_WINDOW = 120;

/** Crée une demande de validation d’offre partenaire (joueur connecté). */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rlCreate = checkRateLimit(
    `partner-offer-claim:create:${ip}:${session.user.id}`,
    CREATE_MAX_PER_WINDOW,
    CREATE_WINDOW_MS
  );
  if (!rlCreate.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rlCreate.retryAfterMs / 1000)) },
      }
    );
  }

  let body: { advertisementId?: string };
  try {
    body = (await request.json()) as { advertisementId?: string };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  const advertisementId = (body.advertisementId ?? "").trim();
  if (!advertisementId) {
    return NextResponse.json({ error: "advertisementId requis." }, { status: 400 });
  }

  const result = await createPartnerOfferClaim({
    userId: session.user.id,
    advertisementId,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 }
    );
  }
  return NextResponse.json({ claimId: result.claimId });
}

/** Demandes du joueur connecté (historique récent). */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rlList = checkRateLimit(
    `partner-offer-claim:list:${ip}:${session.user.id}`,
    LIST_MAX_PER_WINDOW,
    LIST_WINDOW_MS
  );
  if (!rlList.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rlList.retryAfterMs / 1000)) },
      }
    );
  }

  const userId = session.user.id;
  const [claims, pendingRows, approvedGroups] = await Promise.all([
    prisma.partnerOfferClaim.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        advertisementId: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        rejectionReason: true,
        advertisement: {
          select: {
            advertiserName: true,
            title: true,
            imageUrl: true,
            partnerBadgeDefinition: { select: { title: true, imageUrl: true } },
          },
        },
      },
    }),
    prisma.partnerOfferClaim.findMany({
      where: { userId, status: PartnerOfferClaimStatus.PENDING },
      select: { advertisementId: true },
      distinct: ["advertisementId"],
    }),
    prisma.partnerOfferClaim.groupBy({
      by: ["advertisementId"],
      where: { userId, status: PartnerOfferClaimStatus.APPROVED },
      _count: { _all: true },
    }),
  ]);

  const byAd = new Map<string, { pending: boolean; approvedCount: number }>();
  for (const p of pendingRows) {
    byAd.set(p.advertisementId, {
      pending: true,
      approvedCount: byAd.get(p.advertisementId)?.approvedCount ?? 0,
    });
  }
  for (const g of approvedGroups) {
    const prev = byAd.get(g.advertisementId);
    byAd.set(g.advertisementId, {
      pending: prev?.pending ?? false,
      approvedCount: g._count._all,
    });
  }

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
        advertiserName: ad.advertiserName,
        advertisementTitle: ad.title,
        badgeTitle: ad.partnerBadgeDefinition?.title ?? null,
        badgeImageUrl,
      };
    }),
    summaryByAdvertisementId: Object.fromEntries(byAd.entries()),
  });
}
