"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { gateAdventureUpdateContent } from "@/lib/adventure-authorization";
import { isSuperadmin } from "@/lib/admin-access";
import {
  AdventureBadgeInstanceStatus,
  AdventureBadgeStockEventKind,
} from "@/lib/badges/prisma-enums";
import { recomputePhysicalBadgeStockCount } from "@/lib/badges/recompute-physical-badge-stock-count";

const NOTE_MIN = 5;

function validateNote(note: string): string | null {
  const t = note.trim();
  if (t.length < NOTE_MIN) {
    return `Le motif doit contenir au moins ${NOTE_MIN} caractères.`;
  }
  return null;
}

/** Ajoute des exemplaires disponibles (nouveaux numéros) + entrée de journal. */
export async function restockPhysicalBadgeStock(
  adventureId: string,
  quantity: number,
  note: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }
  if (!isSuperadmin(gate.actor.role)) {
    return { success: false, error: "Réservé aux super administrateurs." };
  }
  const err = validateNote(note);
  if (err) {
    return { success: false, error: err };
  }
  const q = Math.floor(quantity);
  if (q < 1 || q > 10_000) {
    return { success: false, error: "Quantité invalide (1 à 10 000)." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const agg = await tx.adventureBadgeInstance.aggregate({
        where: { adventureId },
        _max: { giftNumber: true },
      });
      const start = (agg._max.giftNumber ?? 0) + 1;
      const batch = Array.from({ length: q }, (_, i) => ({
        adventureId,
        giftNumber: start + i,
        status: AdventureBadgeInstanceStatus.AVAILABLE,
      }));
      await tx.adventureBadgeInstance.createMany({ data: batch });

      const availableAfter = await tx.adventureBadgeInstance.count({
        where: { adventureId, status: AdventureBadgeInstanceStatus.AVAILABLE },
      });

      await tx.adventureBadgeStockEvent.create({
        data: {
          adventureId,
          kind: AdventureBadgeStockEventKind.RESTOCK,
          availableDelta: q,
          availableAfter,
          note: note.trim(),
          createdByUserId: gate.actor.id,
        },
      });

      await recomputePhysicalBadgeStockCount(tx, adventureId);
    });

    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Impossible d’enregistrer le réapprovisionnement.",
    };
  }
}

/** Marque tout le stock encore disponible comme perdu (vol, trésor vide, etc.). */
export async function reportPhysicalBadgeLossAll(
  adventureId: string,
  note: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }
  if (!isSuperadmin(gate.actor.role)) {
    return { success: false, error: "Réservé aux super administrateurs." };
  }
  const err = validateNote(note);
  if (err) {
    return { success: false, error: err };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const available = await tx.adventureBadgeInstance.findMany({
        where: { adventureId, status: AdventureBadgeInstanceStatus.AVAILABLE },
        select: { id: true },
      });
      if (available.length === 0) {
        throw new Error("Aucun exemplaire disponible à marquer comme perdu.");
      }
      await tx.adventureBadgeInstance.updateMany({
        where: {
          id: { in: available.map((r) => r.id) },
        },
        data: { status: AdventureBadgeInstanceStatus.STOLEN },
      });

      const availableAfter = await tx.adventureBadgeInstance.count({
        where: { adventureId, status: AdventureBadgeInstanceStatus.AVAILABLE },
      });

      await tx.adventureBadgeStockEvent.create({
        data: {
          adventureId,
          kind: AdventureBadgeStockEventKind.LOSS_INCIDENT,
          availableDelta: -available.length,
          availableAfter,
          note: note.trim(),
          createdByUserId: gate.actor.id,
        },
      });

      await recomputePhysicalBadgeStockCount(tx, adventureId);
    });

    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible d’enregistrer l’incident.",
    };
  }
}

/** Perte partielle du stock disponible (N exemplaires). */
export async function reportPhysicalBadgeLossPartial(
  adventureId: string,
  count: number,
  note: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }
  if (!isSuperadmin(gate.actor.role)) {
    return { success: false, error: "Réservé aux super administrateurs." };
  }
  const err = validateNote(note);
  if (err) {
    return { success: false, error: err };
  }
  const n = Math.floor(count);
  if (n < 1) {
    return { success: false, error: "Nombre invalide." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const toMark = await tx.adventureBadgeInstance.findMany({
        where: { adventureId, status: AdventureBadgeInstanceStatus.AVAILABLE },
        orderBy: { giftNumber: "desc" },
        take: n,
        select: { id: true },
      });
      if (toMark.length < n) {
        throw new Error(
          `Pas assez d’exemplaires disponibles (demandé : ${n}, dispo : ${toMark.length}).`
        );
      }
      await tx.adventureBadgeInstance.updateMany({
        where: { id: { in: toMark.map((r) => r.id) } },
        data: { status: AdventureBadgeInstanceStatus.STOLEN },
      });

      const availableAfter = await tx.adventureBadgeInstance.count({
        where: { adventureId, status: AdventureBadgeInstanceStatus.AVAILABLE },
      });

      await tx.adventureBadgeStockEvent.create({
        data: {
          adventureId,
          kind: AdventureBadgeStockEventKind.LOSS_INCIDENT,
          availableDelta: -toMark.length,
          availableAfter,
          note: note.trim(),
          createdByUserId: gate.actor.id,
        },
      });

      await recomputePhysicalBadgeStockCount(tx, adventureId);
    });

    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible d’enregistrer l’incident.",
    };
  }
}
