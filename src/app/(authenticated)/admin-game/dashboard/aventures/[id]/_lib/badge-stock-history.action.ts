"use server";

import { prisma } from "@/lib/prisma";
import { gateAdventureAction } from "@/lib/adventure-authorization";
import { isSuperadmin } from "@/lib/admin-access";
import type { BadgeStockHistoryEvent } from "./badge-stock-queries";

const PAGE_SIZE = 15;

export type BadgeStockHistoryPageResult =
  | {
      ok: true;
      events: BadgeStockHistoryEvent[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }
  | { ok: false; error: string };

/** Historique paginé (tri par date décroissante). */
export async function fetchBadgeStockHistoryPage(
  adventureId: string,
  page: number
): Promise<BadgeStockHistoryPageResult> {
  const gate = await gateAdventureAction(adventureId, "read");
  if (!gate.ok) {
    return { ok: false, error: "Non autorisé." };
  }
  if (!isSuperadmin(gate.actor.role)) {
    return { ok: false, error: "Réservé aux super administrateurs." };
  }

  const p = Math.max(1, Math.floor(page));

  const total = await prisma.adventureBadgeStockEvent.count({
    where: { adventureId },
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageClamped = Math.min(p, totalPages);
  const skip = (pageClamped - 1) * PAGE_SIZE;

  const rows = await prisma.adventureBadgeStockEvent.findMany({
    where: { adventureId },
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    include: {
      createdBy: { select: { name: true, email: true } },
    },
  });
  const events: BadgeStockHistoryEvent[] = rows.map((e) => ({
    id: e.id,
    kind: e.kind,
    availableDelta: e.availableDelta,
    availableAfter: e.availableAfter,
    note: e.note,
    createdAt: e.createdAt.toISOString(),
    createdByLabel: e.createdBy
      ? e.createdBy.name?.trim() || e.createdBy.email
      : null,
  }));

  return {
    ok: true,
    events,
    page: pageClamped,
    pageSize: PAGE_SIZE,
    total,
    totalPages,
  };
}
