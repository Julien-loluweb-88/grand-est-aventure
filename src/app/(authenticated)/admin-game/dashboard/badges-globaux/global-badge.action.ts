"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import {
  buildCriteriaForAdminKind,
  isAdminGlobalBadgeKind,
  type AdminGlobalBadgeKind,
} from "@/lib/badges/global-badge-metadata";
import { ADMIN_GLOBAL_BADGE_KIND_VALUES } from "@/lib/badges/global-badge-kind-meta";
import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { allocateUniqueMilestoneBadgeSlug } from "@/lib/badges/slugify-milestone-badge";
import { MILESTONE_BADGE_TITLE_MAX_CHARS } from "@/lib/dashboard-text-limits";
import { deleteUploadsFileByUrl } from "@/lib/uploads/delete-uploads-file";

export type GlobalBadgeFormInput = {
  title: string;
  kind: BadgeDefinitionKind;
  sortOrder: number;
  imageUrl: string;
  threshold?: number;
  startHour?: number;
  endHour?: number;
  streakWeeks?: number;
};

async function assertCanMutateGlobalBadges() {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!(await userHasPermissionServer({ permissions: { adventure: ["update"] } }))) {
    return { ok: false as const, error: "Non autorisé." };
  }
  return { ok: true as const, actor };
}

function validateInput(input: GlobalBadgeFormInput): { ok: true } | { ok: false; error: string } {
  const title = input.title.trim();
  if (title.length < 1 || title.length > MILESTONE_BADGE_TITLE_MAX_CHARS) {
    return {
      ok: false,
      error: `Libellé invalide (1–${MILESTONE_BADGE_TITLE_MAX_CHARS} caractères).`,
    };
  }
  if (!isAdminGlobalBadgeKind(input.kind)) {
    return { ok: false, error: "Type de badge invalide." };
  }
  const sortOrder = Math.floor(Number(input.sortOrder));
  if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 999_999) {
    return { ok: false, error: "Ordre invalide." };
  }

  const meta = buildCriteriaForAdminKind(input.kind as AdminGlobalBadgeKind, {
    threshold: input.threshold,
    startHour: input.startHour,
    endHour: input.endHour,
    streakWeeks: input.streakWeeks,
  });

  if (input.kind === BadgeDefinitionKind.MILESTONE_ADVENTURES) {
    const min = (meta as { minCompletedAdventures: number }).minCompletedAdventures;
    if (!Number.isFinite(min) || min < 1 || min > 1_000_000) {
      return { ok: false, error: "Seuil parcours invalide (1 à 1 000 000)." };
    }
  }
  if (input.kind === BadgeDefinitionKind.MILESTONE_KM) {
    const min = (meta as { minKmTotal: number }).minKmTotal;
    if (!Number.isFinite(min) || min < 1 || min > 1_000_000) {
      return { ok: false, error: "Seuil km invalide (1 à 1 000 000)." };
    }
  }
  return { ok: true };
}

export async function createGlobalBadge(
  input: GlobalBadgeFormInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const gate = await assertCanMutateGlobalBadges();
  if (!gate.ok) return { success: false, error: gate.error };

  const v = validateInput(input);
  if (!v.ok) return { success: false, error: v.error };

  if (input.kind === BadgeDefinitionKind.PERFORMANCE_MONTHLY_KM) {
    const dup = await prisma.badgeDefinition.findFirst({
      where: { kind: BadgeDefinitionKind.PERFORMANCE_MONTHLY_KM, adventureId: null },
      select: { id: true },
    });
    if (dup) {
      return {
        success: false,
        error: "Un badge « marcheur du mois » existe déjà. Modifiez-le plutôt que d’en créer un second.",
      };
    }
  }

  const imageUrl = input.imageUrl.trim() || null;
  const kind = input.kind as AdminGlobalBadgeKind;
  const criteria = buildCriteriaForAdminKind(kind, {
    threshold: input.threshold,
    startHour: input.startHour,
    endHour: input.endHour,
    streakWeeks: input.streakWeeks,
  });

  try {
    const slug = await allocateUniqueMilestoneBadgeSlug(input.title.trim());
    const row = await prisma.badgeDefinition.create({
      data: {
        slug,
        title: input.title.trim(),
        kind: input.kind,
        criteria,
        sortOrder: Math.floor(Number(input.sortOrder)),
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

export async function updateGlobalBadge(
  id: string,
  input: GlobalBadgeFormInput
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await assertCanMutateGlobalBadges();
  if (!gate.ok) return { success: false, error: gate.error };

  const v = validateInput(input);
  if (!v.ok) return { success: false, error: v.error };

  const existing = await prisma.badgeDefinition.findUnique({
    where: { id },
    select: { id: true, kind: true, adventureId: true },
  });
  if (!existing || existing.adventureId != null) {
    return { success: false, error: "Badge introuvable." };
  }
  if (!(ADMIN_GLOBAL_BADGE_KIND_VALUES as readonly BadgeDefinitionKind[]).includes(existing.kind)) {
    return { success: false, error: "Ce badge n’est pas un badge global." };
  }

  const imageUrl = input.imageUrl.trim() || null;
  const kind = input.kind as AdminGlobalBadgeKind;
  const criteria = buildCriteriaForAdminKind(kind, {
    threshold: input.threshold,
    startHour: input.startHour,
    endHour: input.endHour,
    streakWeeks: input.streakWeeks,
  });

  try {
    await prisma.badgeDefinition.update({
      where: { id },
      data: {
        title: input.title.trim(),
        kind: input.kind,
        criteria,
        sortOrder: Math.floor(Number(input.sortOrder)),
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

export async function deleteGlobalBadge(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await assertCanMutateGlobalBadges();
  if (!gate.ok) return { success: false, error: gate.error };

  const existing = await prisma.badgeDefinition.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      adventureId: true,
      imageUrl: true,
      partnerAdvertisement: { select: { id: true } },
    },
  });
  if (!existing || existing.adventureId != null) {
    return { success: false, error: "Badge introuvable." };
  }
  if (!(ADMIN_GLOBAL_BADGE_KIND_VALUES as readonly BadgeDefinitionKind[]).includes(existing.kind)) {
    return { success: false, error: "Ce badge n’est pas un badge global." };
  }
  if (existing.partnerAdvertisement) {
    return {
      success: false,
      error: "Ce badge est lié à une publicité ; supprimez d’abord le lien.",
    };
  }

  try {
    await prisma.badgeDefinition.delete({ where: { id } });
    if (existing.imageUrl) {
      await deleteUploadsFileByUrl(existing.imageUrl);
    }
    revalidatePath("/admin-game/dashboard/badges-globaux");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Impossible de supprimer.",
    };
  }
}

/** @deprecated Utiliser createGlobalBadge */
export const createMilestoneBadge = createGlobalBadge;
/** @deprecated Utiliser updateGlobalBadge */
export const updateMilestoneBadge = updateGlobalBadge;
/** @deprecated Utiliser deleteGlobalBadge */
export const deleteMilestoneBadge = deleteGlobalBadge;
