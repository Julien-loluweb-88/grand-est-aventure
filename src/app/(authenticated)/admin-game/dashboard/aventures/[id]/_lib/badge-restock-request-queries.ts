import "server-only";

import { prisma } from "@/lib/prisma";
import { gateAdventureAction } from "@/lib/adventure-authorization";
import { isSuperadmin } from "@/lib/admin-access";
import { AdminRequestStatus } from "@/lib/badges/prisma-enums";

const BADGE_RESTOCK_KEY = "badge_restock";

export type PendingBadgeRestockRequestRow = {
  id: string;
  message: string;
  quantityRequested: number | null;
  createdAt: string;
  requesterLabel: string;
};

export type MyBadgeRestockRequestRow = {
  id: string;
  message: string;
  quantityRequested: number | null;
  status: string;
  createdAt: string;
};

/** Demandes en attente (superadmin uniquement). */
export async function getPendingBadgeRestockRequestsForAdventure(
  adventureId: string
): Promise<PendingBadgeRestockRequestRow[] | null> {
  const gate = await gateAdventureAction(adventureId, "read");
  if (!gate.ok || !isSuperadmin(gate.actor.role)) {
    return null;
  }

  const rows = await prisma.adminRequest.findMany({
    where: {
      requestType: { key: BADGE_RESTOCK_KEY },
      adventureId,
      status: AdminRequestStatus.PENDING,
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { name: true, email: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    message: r.message ?? "",
    quantityRequested:
      typeof r.payload === "object" &&
      r.payload &&
      "quantityRequested" in r.payload &&
      typeof (r.payload as { quantityRequested?: unknown }).quantityRequested === "number"
        ? ((r.payload as { quantityRequested: number }).quantityRequested ?? null)
        : null,
    createdAt: r.createdAt.toISOString(),
    requesterLabel: r.requester.name?.trim() || r.requester.email,
  }));
}

/** Historique des demandes de l’admin courant sur cette aventure (hors superadmin). */
export async function getMyBadgeRestockRequestsForAdventure(
  adventureId: string,
  requesterId: string
): Promise<MyBadgeRestockRequestRow[] | null> {
  const gate = await gateAdventureAction(adventureId, "read");
  if (!gate.ok) {
    return null;
  }
  if (isSuperadmin(gate.actor.role)) {
    return [];
  }

  const rows = await prisma.adminRequest.findMany({
    where: { requestType: { key: BADGE_RESTOCK_KEY }, adventureId, requesterId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return rows.map((r) => ({
    id: r.id,
    message: r.message ?? "",
    quantityRequested:
      typeof r.payload === "object" &&
      r.payload &&
      "quantityRequested" in r.payload &&
      typeof (r.payload as { quantityRequested?: unknown }).quantityRequested === "number"
        ? ((r.payload as { quantityRequested: number }).quantityRequested ?? null)
        : null,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
}
