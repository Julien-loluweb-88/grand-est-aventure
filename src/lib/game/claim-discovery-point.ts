import type { Prisma } from "../../../generated/prisma/client";
import { BadgeDefinitionKind } from "../../../generated/prisma/client";
import { haversineMeters } from "@/lib/geo/haversine-meters";

type Tx = Prisma.TransactionClient;

export type ClaimDiscoveryResult =
  | { ok: true; alreadyHad: boolean; userBadgeId: string }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "TOO_FAR"
        | "ADVENTURE_REQUIRED"
        | "NO_BADGE"
        | "INACTIVE_ADVENTURE";
      message: string;
    };

/**
 * Attribue le badge DISCOVERY si le joueur est dans la géofence et respecte les règles
 * (ville libre vs point réservé à une aventure : partie existante sur cette aventure).
 */
export async function claimDiscoveryPointInTransaction(
  tx: Tx,
  input: {
    userId: string;
    discoveryPointId: string;
    clientLatitude: number;
    clientLongitude: number;
  }
): Promise<ClaimDiscoveryResult> {
  const point = await tx.discoveryPoint.findUnique({
    where: { id: input.discoveryPointId },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      adventureId: true,
      adventure: { select: { id: true, status: true, cityId: true } },
      cityId: true,
      badgeDefinition: {
        select: { id: true, kind: true },
      },
    },
  });

  if (!point) {
    return { ok: false, code: "NOT_FOUND", message: "Point de découverte introuvable." };
  }

  if (!point.badgeDefinition || point.badgeDefinition.kind !== BadgeDefinitionKind.DISCOVERY) {
    return { ok: false, code: "NO_BADGE", message: "Badge non configuré pour ce point." };
  }

  const dist = haversineMeters(
    input.clientLatitude,
    input.clientLongitude,
    point.latitude,
    point.longitude
  );
  if (dist > point.radiusMeters) {
    return {
      ok: false,
      code: "TOO_FAR",
      message: "Vous êtes trop loin du lieu à découvrir.",
    };
  }

  if (point.adventureId) {
    if (!point.adventure || point.adventure.status === false) {
      return {
        ok: false,
        code: "INACTIVE_ADVENTURE",
        message: "Aventure inactive ou introuvable.",
      };
    }
    const played = await tx.userAdventures.findFirst({
      where: { userId: input.userId, adventureId: point.adventureId },
      select: { id: true },
    });
    if (!played) {
      return {
        ok: false,
        code: "ADVENTURE_REQUIRED",
        message: "Démarrez cette aventure pour débloquer ce lieu.",
      };
    }
  }

  const existing = await tx.userBadge.findUnique({
    where: {
      userId_badgeDefinitionId: {
        userId: input.userId,
        badgeDefinitionId: point.badgeDefinition.id,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, alreadyHad: true, userBadgeId: existing.id };
  }

  const row = await tx.userBadge.create({
    data: {
      userId: input.userId,
      badgeDefinitionId: point.badgeDefinition.id,
    },
    select: { id: true },
  });
  return { ok: true, alreadyHad: false, userBadgeId: row.id };
}
