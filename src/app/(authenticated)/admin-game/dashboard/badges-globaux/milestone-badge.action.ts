"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { allocateUniqueMilestoneBadgeSlug } from "@/lib/badges/slugify-milestone-badge";
import { MILESTONE_BADGE_TITLE_MAX_CHARS } from "@/lib/dashboard-text-limits";

const MILESTONE_KINDS: BadgeDefinitionKind[] = [
  BadgeDefinitionKind.MILESTONE_ADVENTURES,
  BadgeDefinitionKind.MILESTONE_KM,
];

function buildCriteria(
  kind: BadgeDefinitionKind,
  threshold: number
): Record<string, number> {
  if (kind === BadgeDefinitionKind.MILESTONE_ADVENTURES) {
    return { minCompletedAdventures: threshold };
  }
  return { minKmTotal: threshold };
}

async function assertCanMutateMilestoneBadges() {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!(await userHasPermissionServer({ permissions: { adventure: ["update"] } }))) {
    return { ok: false as const, error: "Non autorisé." };
  }
  return { ok: true as const, actor };
}

export async function createMilestoneBadge(input: {
  title: string;
  kind: BadgeDefinitionKind;
  threshold: number;
  sortOrder: number;
  imageUrl: string;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const gate = await assertCanMutateMilestoneBadges();
  if (!gate.ok) return { success: false, error: gate.error };

  const title = input.title.trim();
  if (title.length < 1 || title.length > MILESTONE_BADGE_TITLE_MAX_CHARS) {
    return {
      success: false,
      error: `Libellé invalide (1–${MILESTONE_BADGE_TITLE_MAX_CHARS} caractères).`,
    };
  }
  if (!MILESTONE_KINDS.includes(input.kind)) {
    return { success: false, error: "Type de palier invalide." };
  }
  const threshold = Math.floor(Number(input.threshold));
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 1_000_000) {
    return { success: false, error: "Seuil invalide (1 à 1 000 000)." };
  }
  const sortOrder = Math.floor(Number(input.sortOrder));
  if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 999_999) {
    return { success: false, error: "Ordre invalide." };
  }
  const imageUrl = input.imageUrl.trim() || null;

  try {
    const slug = await allocateUniqueMilestoneBadgeSlug(title);
    const row = await prisma.badgeDefinition.create({
      data: {
        slug,
        title,
        kind: input.kind,
        criteria: buildCriteria(input.kind, threshold),
        sortOrder,
        imageUrl,
      },
      select: { id: true },
    });
    revalidatePath("/admin-game/dashboard/badges-globaux");
    return { success: true, id: row.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de créer le badge.",
    };
  }
}

export async function updateMilestoneBadge(
  id: string,
  input: {
    title: string;
    kind: BadgeDefinitionKind;
    threshold: number;
    sortOrder: number;
    imageUrl: string;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await assertCanMutateMilestoneBadges();
  if (!gate.ok) return { success: false, error: gate.error };

  const title = input.title.trim();
  if (title.length < 1 || title.length > MILESTONE_BADGE_TITLE_MAX_CHARS) {
    return {
      success: false,
      error: `Libellé invalide (1–${MILESTONE_BADGE_TITLE_MAX_CHARS} caractères).`,
    };
  }
  if (!MILESTONE_KINDS.includes(input.kind)) {
    return { success: false, error: "Type de palier invalide." };
  }
  const threshold = Math.floor(Number(input.threshold));
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 1_000_000) {
    return { success: false, error: "Seuil invalide." };
  }
  const sortOrder = Math.floor(Number(input.sortOrder));
  if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 999_999) {
    return { success: false, error: "Ordre invalide." };
  }
  const imageUrl = input.imageUrl.trim() || null;

  const existing = await prisma.badgeDefinition.findUnique({
    where: { id },
    select: { id: true, kind: true, adventureId: true },
  });
  if (!existing || existing.adventureId != null) {
    return { success: false, error: "Badge introuvable." };
  }
  if (!MILESTONE_KINDS.includes(existing.kind)) {
    return { success: false, error: "Ce badge n’est pas un palier global." };
  }

  try {
    await prisma.badgeDefinition.update({
      where: { id },
      data: {
        title,
        kind: input.kind,
        criteria: buildCriteria(input.kind, threshold),
        sortOrder,
        imageUrl,
      },
    });
    revalidatePath("/admin-game/dashboard/badges-globaux");
    revalidatePath(`/admin-game/dashboard/badges-globaux/${id}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de mettre à jour.",
    };
  }
}

export async function deleteMilestoneBadge(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await assertCanMutateMilestoneBadges();
  if (!gate.ok) return { success: false, error: gate.error };

  const existing = await prisma.badgeDefinition.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      adventureId: true,
      partnerAdvertisement: { select: { id: true } },
    },
  });
  if (!existing || existing.adventureId != null) {
    return { success: false, error: "Badge introuvable." };
  }
  if (!MILESTONE_KINDS.includes(existing.kind)) {
    return { success: false, error: "Ce badge n’est pas un palier global." };
  }
  if (existing.partnerAdvertisement) {
    return { success: false, error: "Ce badge est lié à une publicité ; supprimez d’abord le lien." };
  }

  try {
    await prisma.badgeDefinition.delete({ where: { id } });
    revalidatePath("/admin-game/dashboard/badges-globaux");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de supprimer.",
    };
  }
}

export { MILESTONE_KINDS };
