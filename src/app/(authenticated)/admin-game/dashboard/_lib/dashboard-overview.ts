import "server-only";

import { prisma } from "@/lib/prisma";
import type { AdminSessionCapabilities } from "@/lib/admin-session-capabilities";
import { getManagedAdventureIds, isSuperadmin } from "@/lib/admin-access";
import {
  AdminRequestStatus,
  AdventureAudience,
  AdventureReviewModerationStatus,
  BadgeDefinitionKind,
  PartnerOfferClaimStatus,
} from "@/lib/badges/prisma-enums";

export type DashboardOverview =
  | {
      kind: "merchant";
      assignedAdvertisementCount: number;
      pendingPartnerClaimCount: number;
    }
  | {
      kind: "admin";
      stats: {
        adventuresTotal: number;
        adventuresPublic: number;
        adventuresDemo: number;
        cities: number;
        advertisementsTotal: number;
        advertisementsActiveWindow: number;
        milestoneBadges: number;
        /** Parties non terminées (`UserAdventures.success = false`), périmètre assigné pour les admins client. */
        ongoingUserAdventures: number;
        /** Avis / signalements en attente de modération. */
        pendingAdventureReviews: number;
        users?: number;
        pendingAdminRequests?: number;
      };
      pendingRequestsPreview?: {
        id: string;
        createdAtIso: string;
        typeLabel: string;
        requesterLabel: string;
      }[];
      auditPreview?: {
        id: string;
        createdAtIso: string;
        action: string;
        actorLabel: string;
      }[];
      reviewsPendingPreview?: {
        id: string;
        updatedAtIso: string;
        adventureId: string;
        adventureName: string;
        authorLabel: string;
      }[];
    };

export async function getDashboardOverview(params: {
  userId: string;
  capabilities: AdminSessionCapabilities;
}): Promise<DashboardOverview> {
  const { userId, capabilities: caps } = params;

  if (caps.merchantPortal) {
    const assignments = await prisma.merchantAdvertisement.findMany({
      where: { userId },
      select: { advertisementId: true },
    });
    const adIds = assignments.map((a) => a.advertisementId);
    const pendingPartnerClaimCount =
      adIds.length === 0
        ? 0
        : await prisma.partnerOfferClaim.count({
            where: {
              advertisementId: { in: adIds },
              status: PartnerOfferClaimStatus.PENDING,
            },
          });

    return {
      kind: "merchant",
      assignedAdvertisementCount: adIds.length,
      pendingPartnerClaimCount,
    };
  }

  if (!caps.adventure.read) {
    return {
      kind: "admin",
      stats: {
        adventuresTotal: 0,
        adventuresPublic: 0,
        adventuresDemo: 0,
        cities: 0,
        advertisementsTotal: 0,
        advertisementsActiveWindow: 0,
        milestoneBadges: 0,
        ongoingUserAdventures: 0,
        pendingAdventureReviews: 0,
      },
    };
  }

  const actorRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const managedIds = isSuperadmin(actorRow?.role)
    ? null
    : await getManagedAdventureIds(userId);
  const adventureScopeWhere =
    managedIds === null ? {} : { adventureId: { in: managedIds } };

  const now = new Date();

  const baseQueries = Promise.all([
    prisma.adventure.count(),
    prisma.adventure.count({ where: { audience: AdventureAudience.PUBLIC } }),
    prisma.adventure.count({ where: { audience: AdventureAudience.DEMO } }),
    prisma.city.count(),
    prisma.advertisement.count(),
    prisma.advertisement.count({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
    }),
    prisma.badgeDefinition.count({
      where: {
        kind: {
          in: [BadgeDefinitionKind.MILESTONE_ADVENTURES, BadgeDefinitionKind.MILESTONE_KM],
        },
        adventureId: null,
      },
    }),
    prisma.userAdventures.count({
      where: { success: false, ...adventureScopeWhere },
    }),
    prisma.adventureReview.count({
      where: {
        moderationStatus: AdventureReviewModerationStatus.PENDING,
        ...adventureScopeWhere,
      },
    }),
    prisma.adventureReview.findMany({
      where: {
        moderationStatus: AdventureReviewModerationStatus.PENDING,
        ...adventureScopeWhere,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        updatedAt: true,
        adventure: { select: { id: true, name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const usersCountPromise = caps.user.get ? prisma.user.count() : Promise.resolve(undefined);

  const superQueries =
    caps.canAssignRolesAndScopes
      ? Promise.all([
          prisma.adminRequest.count({
            where: { status: AdminRequestStatus.PENDING },
          }),
          prisma.adminRequest.findMany({
            where: { status: AdminRequestStatus.PENDING },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              createdAt: true,
              requestType: { select: { label: true } },
              requester: { select: { name: true, email: true } },
            },
          }),
          prisma.adminAuditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              createdAt: true,
              action: true,
              actor: { select: { name: true, email: true } },
            },
          }),
        ])
      : Promise.resolve(null);

  const [
    [
      adventuresTotal,
      adventuresPublic,
      adventuresDemo,
      cities,
      advertisementsTotal,
      advertisementsActiveWindow,
      milestoneBadges,
      ongoingUserAdventures,
      pendingAdventureReviews,
      reviewsPreviewRows,
    ],
    usersCount,
    superPack,
  ] = await Promise.all([baseQueries, usersCountPromise, superQueries]);

  const stats = {
    adventuresTotal,
    adventuresPublic,
    adventuresDemo,
    cities,
    advertisementsTotal,
    advertisementsActiveWindow,
    milestoneBadges,
    ongoingUserAdventures,
    pendingAdventureReviews,
    ...(typeof usersCount === "number" ? { users: usersCount } : {}),
    ...(superPack
      ? {
          pendingAdminRequests: superPack[0],
        }
      : {}),
  };

  const pendingRequestsPreview =
    superPack?.[1].map((r) => ({
      id: r.id,
      createdAtIso: r.createdAt.toISOString(),
      typeLabel: r.requestType.label,
      requesterLabel: r.requester.name?.trim() || r.requester.email,
    })) ?? undefined;

  const auditPreview =
    superPack?.[2].map((e) => ({
      id: e.id,
      createdAtIso: e.createdAt.toISOString(),
      action: e.action,
      actorLabel: e.actor.name?.trim() || e.actor.email,
    })) ?? undefined;

  const reviewsPendingPreview =
    reviewsPreviewRows.length > 0
      ? reviewsPreviewRows.map((r) => ({
          id: r.id,
          updatedAtIso: r.updatedAt.toISOString(),
          adventureId: r.adventure.id,
          adventureName: r.adventure.name,
          authorLabel: r.user.name?.trim() || r.user.email,
        }))
      : undefined;

  return {
    kind: "admin",
    stats,
    ...(pendingRequestsPreview && pendingRequestsPreview.length > 0
      ? { pendingRequestsPreview }
      : {}),
    ...(auditPreview && auditPreview.length > 0 ? { auditPreview } : {}),
    ...(reviewsPendingPreview ? { reviewsPendingPreview } : {}),
  };
}
