"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { gateAdventureUpdateContent } from "@/lib/adventure-authorization";
import { PARTNER_WHEEL_TERMS_MAX_CHARS } from "@/lib/dashboard-text-limits";
import { getPartnerWheelStatsForAdventureAdmin } from "./partner-lots-queries";

export type PartnerLotWriteInput = {
  partnerName: string;
  title: string;
  description: string | null;
  redemptionHint: string | null;
  weight: number;
  quantityRemaining: number | null;
  active: boolean;
  validFromIso: string | null;
  validUntilIso: string | null;
  /** `adventure` = uniquement cette aventure ; `city` = toutes les aventures de la même ville. */
  scope: "adventure" | "city";
};

function parseOptionalDate(iso: string | null): Date | null {
  if (iso == null || iso.trim() === "") {
    return null;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d;
}

export async function createPartnerLotForAdventure(
  adventureId: string,
  input: PartnerLotWriteInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  const partnerName = input.partnerName.trim();
  const title = input.title.trim();
  if (!partnerName || !title) {
    return { success: false, error: "Partenaire et titre requis." };
  }
  const weight = Math.floor(input.weight);
  if (weight < 1 || weight > 1000) {
    return { success: false, error: "Poids invalide (1 à 1000)." };
  }

  let quantityRemaining: number | null = null;
  if (input.quantityRemaining != null) {
    const q = Math.floor(input.quantityRemaining);
    if (q < 1 || q > 1_000_000) {
      return { success: false, error: "Stock invalide." };
    }
    quantityRemaining = q;
  }

  const adv = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { cityId: true },
  });
  if (!adv) {
    return { success: false, error: "Aventure introuvable." };
  }

  const validFrom = parseOptionalDate(input.validFromIso);
  const validUntil = parseOptionalDate(input.validUntilIso);
  if (
    validFrom &&
    validUntil &&
    validFrom.getTime() > validUntil.getTime()
  ) {
    return { success: false, error: "La date de fin doit être après le début." };
  }

  const scopeAdventure = input.scope === "adventure";

  const row = await prisma.adventurePartnerLot.create({
    data: {
      partnerName,
      title,
      description: input.description?.trim() || null,
      redemptionHint: input.redemptionHint?.trim() || null,
      weight,
      quantityRemaining,
      active: input.active,
      validFrom,
      validUntil,
      adventureId: scopeAdventure ? adventureId : null,
      cityId: scopeAdventure ? null : adv.cityId,
    },
    select: { id: true },
  });

  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  return { success: true, id: row.id };
}

export async function updatePartnerLot(
  adventureId: string,
  lotId: string,
  input: PartnerLotWriteInput
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  const existing = await prisma.adventurePartnerLot.findFirst({
    where: { id: lotId },
    select: {
      id: true,
      adventureId: true,
      cityId: true,
    },
  });
  if (!existing) {
    return { success: false, error: "Lot introuvable." };
  }

  const adv = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { cityId: true },
  });
  if (!adv) {
    return { success: false, error: "Aventure introuvable." };
  }

  const inScope =
    existing.adventureId === adventureId ||
    (existing.adventureId == null && existing.cityId === adv.cityId);
  if (!inScope) {
    return { success: false, error: "Ce lot n’est pas géré depuis cette aventure." };
  }

  const partnerName = input.partnerName.trim();
  const title = input.title.trim();
  if (!partnerName || !title) {
    return { success: false, error: "Partenaire et titre requis." };
  }
  const weight = Math.floor(input.weight);
  if (weight < 1 || weight > 1000) {
    return { success: false, error: "Poids invalide (1 à 1000)." };
  }

  let quantityRemaining: number | null = null;
  if (input.quantityRemaining != null) {
    const q = Math.floor(input.quantityRemaining);
    if (q < 0 || q > 1_000_000) {
      return { success: false, error: "Stock invalide." };
    }
    quantityRemaining = q === 0 ? 0 : q;
  }

  const validFrom = parseOptionalDate(input.validFromIso);
  const validUntil = parseOptionalDate(input.validUntilIso);
  if (
    validFrom &&
    validUntil &&
    validFrom.getTime() > validUntil.getTime()
  ) {
    return { success: false, error: "La date de fin doit être après le début." };
  }

  const scopeAdventure = input.scope === "adventure";

  await prisma.adventurePartnerLot.update({
    where: { id: lotId },
    data: {
      partnerName,
      title,
      description: input.description?.trim() || null,
      redemptionHint: input.redemptionHint?.trim() || null,
      weight,
      quantityRemaining,
      active: input.active,
      validFrom,
      validUntil,
      adventureId: scopeAdventure ? adventureId : null,
      cityId: scopeAdventure ? null : adv.cityId,
    },
  });

  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  return { success: true };
}

export async function deletePartnerLot(
  adventureId: string,
  lotId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  const existing = await prisma.adventurePartnerLot.findFirst({
    where: { id: lotId },
    select: {
      id: true,
      adventureId: true,
      cityId: true,
    },
  });
  if (!existing) {
    return { success: false, error: "Lot introuvable." };
  }

  const adv = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { cityId: true },
  });
  if (!adv) {
    return { success: false, error: "Aventure introuvable." };
  }

  const inScope =
    existing.adventureId === adventureId ||
    (existing.adventureId == null && existing.cityId === adv.cityId);
  if (!inScope) {
    return { success: false, error: "Ce lot n’est pas géré depuis cette aventure." };
  }

  const wins = await prisma.userAdventurePartnerLotWin.count({
    where: { adventurePartnerLotId: lotId },
  });
  if (wins > 0) {
    return {
      success: false,
      error: "Impossible de supprimer : des joueurs ont déjà gagné ce lot.",
    };
  }

  await prisma.adventurePartnerLot.delete({ where: { id: lotId } });
  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  return { success: true };
}

function csvCell(value: string | number | null): string {
  const s = value === null || value === "" ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Texte règlement / RGPD affiché aux joueurs (priorité au texte aventure, sinon ville). */
export async function saveAdventurePartnerWheelTerms(
  adventureId: string,
  raw: string | null
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  const trimmed = (raw ?? "").trim();
  const value = trimmed === "" ? null : trimmed;
  if (value != null && value.length > PARTNER_WHEEL_TERMS_MAX_CHARS) {
    return {
      success: false,
      error: `Texte trop long (max. ${PARTNER_WHEEL_TERMS_MAX_CHARS} caractères).`,
    };
  }

  await prisma.adventure.update({
    where: { id: adventureId },
    data: { partnerWheelTerms: value },
  });
  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  return { success: true };
}

/** CSV UTF-8 (BOM) pour tableur — lots du périmètre + tirages sur cette aventure. */
export async function exportPartnerWheelStatsCsv(adventureId: string): Promise<
  | { success: true; csv: string; filename: string }
  | { success: false; error: string }
> {
  const stats = await getPartnerWheelStatsForAdventureAdmin(adventureId);
  if (!stats) {
    return { success: false, error: "Non autorisé ou aventure introuvable." };
  }

  const lines = [
    ["lotId", "partenaire", "titre", "tirages", "validations_magasin", "stock_restant"].join(
      ","
    ),
    ...stats.rows.map((r) =>
      [
        csvCell(r.lotId),
        csvCell(r.partnerName),
        csvCell(r.title),
        csvCell(r.spinCount),
        csvCell(r.redeemedCount),
        csvCell(
          r.quantityRemaining === null ? "illimite" : String(r.quantityRemaining)
        ),
      ].join(",")
    ),
  ];
  const body = `\uFEFFTotal_tirages_aventure,${stats.spinsTotal}\n${lines.join("\n")}`;
  return {
    success: true,
    csv: body,
    filename: `roue-partenaires-${adventureId.slice(0, 8)}.csv`,
  };
}
