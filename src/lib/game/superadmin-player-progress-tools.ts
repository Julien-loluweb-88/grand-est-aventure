import "server-only";

import type { Prisma } from "../../../generated/prisma/client";
import {
  AdventureBadgeInstanceStatus,
  BadgeDefinitionKind,
} from "../../../generated/prisma/client";
import { processGameFinish } from "@/lib/badges/award-on-finish";
import {
  parseMilestoneAdventuresCriteria,
  parseMilestoneKmCriteria,
} from "@/lib/badges/criteria/parse-criteria";
import {
  countDistinctCompletedAdventures,
  sumKmCompletedAdventures,
} from "@/lib/badges/load-global-badge-stats";
import {
  enigmaStepKey,
  TREASURE_STEP_KEY,
} from "@/lib/game/adventure-step-keys";
import { recordStepValidated } from "@/lib/game/server-adventure-progress";
import { getUserRoleForAccess } from "@/lib/adventure-public-access";
import { ensureActivePlaySession } from "@/lib/game/user-adventure-play-session";
import {
  processAdventureReview,
  ReviewValidationError,
} from "@/lib/game/process-adventure-review";
import { prisma } from "@/lib/prisma";
import type { AdventureReviewModerationStatus } from "../../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Retire uniquement les paliers seuil si la progression admin ne les justifie plus. */
async function syncMilestoneBadgesAfterProgressChange(tx: Tx, userId: string): Promise<void> {
  const milestones = await tx.badgeDefinition.findMany({
    where: {
      kind: {
        in: [
          BadgeDefinitionKind.MILESTONE_ADVENTURES,
          BadgeDefinitionKind.MILESTONE_KM,
        ],
      },
      adventureId: null,
    },
    select: { id: true, kind: true, criteria: true },
  });

  const completedAdventures = await countDistinctCompletedAdventures(tx, userId);
  const totalKm = await sumKmCompletedAdventures(tx, userId);

  for (const def of milestones) {
    let stillEarned = false;
    if (def.kind === BadgeDefinitionKind.MILESTONE_ADVENTURES) {
      const min = parseMilestoneAdventuresCriteria(def.criteria).minCompletedAdventures;
      stillEarned = typeof min === "number" && completedAdventures >= min;
    } else if (def.kind === BadgeDefinitionKind.MILESTONE_KM) {
      const min = parseMilestoneKmCriteria(def.criteria).minKmTotal;
      stillEarned = typeof min === "number" && totalKm >= min;
    }
    if (stillEarned) {
      continue;
    }
    await tx.userBadge.deleteMany({
      where: { userId, badgeDefinitionId: def.id },
    });
  }
}

async function seedAllRequiredSteps(
  tx: Tx,
  userId: string,
  adventureId: string
): Promise<void> {
  const adventure = await tx.adventure.findUnique({
    where: { id: adventureId },
    select: {
      enigmas: { select: { number: true }, orderBy: { number: "asc" } },
      treasure: { select: { id: true } },
    },
  });
  if (!adventure) {
    throw new Error("Aventure introuvable.");
  }
  for (const e of adventure.enigmas) {
    await recordStepValidated(tx, userId, adventureId, enigmaStepKey(e.number));
  }
  if (adventure.treasure != null) {
    await recordStepValidated(tx, userId, adventureId, TREASURE_STEP_KEY);
  }
  await ensureActivePlaySession(tx, userId, adventureId);
}

export type ProgressStepKind = "enigma" | "treasure";

export type ProgressStepItem = {
  stepKey: string;
  label: string;
  kind: ProgressStepKind;
  validated: boolean;
};

export type PlayerAdventureReviewSnapshot = {
  id: string;
  rating: number | null;
  content: string | null;
  image: string | null;
  moderationStatus: AdventureReviewModerationStatus;
  consentCommunicationNetworks: boolean;
  reportsMissingBadge: boolean;
  reportsStolenTreasure: boolean;
  updatedAt: string;
};

export type PlayerAdventureProgressSnapshot = {
  adventureId: string;
  adventureName: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  validatedStepKeys: string[];
  steps: ProgressStepItem[];
  userAdventure: { success: boolean; giftNumber: number; updatedAt: string } | null;
  hasTreasure: boolean;
  requiredEnigmaNumbers: number[];
  missingStepKeysForFinish: string[];
  serverReadyForSuccessFinish: boolean;
  hasPartnerLotWin: boolean;
  adventureBadgeEarned: boolean;
  adventureReview: PlayerAdventureReviewSnapshot | null;
};

function buildProgressSteps(input: {
  requiredEnigmaNumbers: number[];
  hasTreasure: boolean;
  validatedStepKeys: string[];
}): ProgressStepItem[] {
  const validated = new Set(input.validatedStepKeys);
  const steps: ProgressStepItem[] = input.requiredEnigmaNumbers.map((n) => {
    const stepKey = enigmaStepKey(n);
    return {
      stepKey,
      label: `Énigme ${n}`,
      kind: "enigma" as const,
      validated: validated.has(stepKey),
    };
  });
  if (input.hasTreasure) {
    steps.push({
      stepKey: TREASURE_STEP_KEY,
      label: "Trésor — coffre",
      kind: "treasure",
      validated: validated.has(TREASURE_STEP_KEY),
    });
  }
  return steps;
}

/** Annule fin de partie, badges et lot sans toucher aux autres validations d’étapes. */
async function revertAdventureFinishArtifacts(
  tx: Tx,
  userId: string,
  adventureId: string
): Promise<void> {
  await tx.userAdventurePartnerLotWin.deleteMany({
    where: { userId, adventureId },
  });
  await tx.adventureReview.deleteMany({
    where: { userId, adventureId },
  });
  const adventureDef = await tx.badgeDefinition.findUnique({
    where: { adventureId },
    select: { id: true },
  });
  if (adventureDef) {
    await tx.userBadge.deleteMany({
      where: { userId, badgeDefinitionId: adventureDef.id },
    });
  }
  await tx.adventureBadgeInstance.updateMany({
    where: {
      adventureId,
      claimedByUserId: userId,
      status: AdventureBadgeInstanceStatus.CLAIMED,
    },
    data: {
      status: AdventureBadgeInstanceStatus.AVAILABLE,
      claimedByUserId: null,
      claimedAt: null,
    },
  });
  await tx.userAdventures.deleteMany({
    where: { userId, adventureId },
  });
  await syncMilestoneBadgesAfterProgressChange(tx, userId);
}

function isAllowedStepKeyForAdventure(
  stepKey: string,
  requiredEnigmaNumbers: number[],
  hasTreasure: boolean
): boolean {
  for (const n of requiredEnigmaNumbers) {
    if (stepKey === enigmaStepKey(n)) {
      return true;
    }
  }
  if (hasTreasure) {
    return stepKey === TREASURE_STEP_KEY;
  }
  return false;
}

export async function getPlayerAdventureProgressSnapshot(
  userId: string,
  adventureId: string
): Promise<PlayerAdventureProgressSnapshot | null> {
  const [user, adventure, validations, userAdventure, partnerWin, adventureBadge, adventureReview] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      }),
      prisma.adventure.findUnique({
        where: { id: adventureId },
        select: {
          id: true,
          name: true,
          enigmas: { select: { number: true }, orderBy: { number: "asc" } },
          treasure: { select: { id: true } },
        },
      }),
      prisma.userAdventureStepValidation.findMany({
        where: { userId, adventureId },
        select: { stepKey: true },
        orderBy: { validatedAt: "asc" },
      }),
      prisma.userAdventures.findFirst({
        where: { userId, adventureId },
        select: { success: true, giftNumber: true, updatedAt: true },
      }),
      prisma.userAdventurePartnerLotWin.findUnique({
        where: { userId_adventureId: { userId, adventureId } },
        select: { id: true },
      }),
      prisma.badgeDefinition.findUnique({
        where: { adventureId },
        select: {
          userBadges: { where: { userId }, select: { id: true }, take: 1 },
        },
      }),
      prisma.adventureReview.findUnique({
        where: {
          userId_adventureId: { userId, adventureId },
        },
        select: {
          id: true,
          rating: true,
          content: true,
          image: true,
          moderationStatus: true,
          consentCommunicationNetworks: true,
          reportsMissingBadge: true,
          reportsStolenTreasure: true,
          updatedAt: true,
        },
      }),
    ]);

  if (!user || !adventure) {
    return null;
  }

  const validatedStepKeys = validations.map((v) => v.stepKey);
  const requiredEnigmaNumbers = adventure.enigmas.map((e) => e.number);
  const hasTreasure = adventure.treasure != null;
  const missingForFinish: string[] = [];

  for (const n of requiredEnigmaNumbers) {
    const key = enigmaStepKey(n);
    if (!validatedStepKeys.includes(key)) {
      missingForFinish.push(key);
    }
  }
  if (hasTreasure && !validatedStepKeys.includes(TREASURE_STEP_KEY)) {
    missingForFinish.push(TREASURE_STEP_KEY);
  }

  const serverReadyForSuccessFinish =
    (requiredEnigmaNumbers.length === 0 && !hasTreasure) || missingForFinish.length === 0;

  const steps = buildProgressSteps({
    requiredEnigmaNumbers,
    hasTreasure,
    validatedStepKeys,
  });

  return {
    adventureId,
    adventureName: adventure.name,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    validatedStepKeys,
    steps,
    userAdventure: userAdventure
      ? {
          success: userAdventure.success,
          giftNumber: userAdventure.giftNumber,
          updatedAt: userAdventure.updatedAt.toISOString(),
        }
      : null,
    hasTreasure,
    requiredEnigmaNumbers,
    missingStepKeysForFinish: missingForFinish,
    serverReadyForSuccessFinish,
    hasPartnerLotWin: partnerWin != null,
    adventureBadgeEarned: (adventureBadge?.userBadges.length ?? 0) > 0,
    adventureReview: adventureReview
      ? {
          id: adventureReview.id,
          rating: adventureReview.rating,
          content: adventureReview.content,
          image: adventureReview.image,
          moderationStatus: adventureReview.moderationStatus,
          consentCommunicationNetworks: adventureReview.consentCommunicationNetworks,
          reportsMissingBadge: adventureReview.reportsMissingBadge,
          reportsStolenTreasure: adventureReview.reportsStolenTreasure,
          updatedAt: adventureReview.updatedAt.toISOString(),
        }
      : null,
  };
}

function reviewValidationMessage(code: ReviewValidationError["code"]): string {
  const map: Record<ReviewValidationError["code"], string> = {
    INVALID_RATING: "La note doit être un entier entre 1 et 5.",
    CONTENT_TOO_LONG: "Le commentaire dépasse 10 000 caractères.",
    ADVENTURE_NOT_FOUND: "Aventure introuvable ou inaccessible pour ce joueur.",
    EMPTY_REVIEW:
      "Renseignez au moins une note, un commentaire ou un signalement (badge / trésor).",
  };
  return map[code];
}

export async function superadminUpsertAdventureReview(input: {
  userId: string;
  adventureId: string;
  rating: number | null;
  content: string;
  reportsMissingBadge: boolean;
  reportsStolenTreasure: boolean;
  consentCommunicationNetworks: boolean;
  moderationStatus: AdventureReviewModerationStatus;
}): Promise<{ ok: true; reviewId: string } | { ok: false; error: string }> {
  try {
    const userRole = await getUserRoleForAccess(input.userId);
    const { id } = await prisma.$transaction(async (tx) => {
      const result = await processAdventureReview(tx, {
        adventureId: input.adventureId,
        userId: input.userId,
        userRole,
        rating: input.rating ?? undefined,
        content: input.content,
        consentCommunicationNetworks: input.consentCommunicationNetworks,
        reportsMissingBadge: input.reportsMissingBadge,
        reportsStolenTreasure: input.reportsStolenTreasure,
      });
      await tx.adventureReview.update({
        where: { id: result.id },
        data: { moderationStatus: input.moderationStatus },
      });
      return result;
    });
    return { ok: true, reviewId: id };
  } catch (e) {
    if (e instanceof ReviewValidationError) {
      return { ok: false, error: reviewValidationMessage(e.code) };
    }
    if (e instanceof Error) {
      return { ok: false, error: e.message };
    }
    return { ok: false, error: "Erreur lors de l’enregistrement de l’avis." };
  }
}

export async function superadminDeleteAdventureReview(input: {
  userId: string;
  adventureId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await prisma.adventureReview.deleteMany({
    where: { userId: input.userId, adventureId: input.adventureId },
  });
  return { ok: true };
}

export async function superadminForceCompleteAdventure(input: {
  userId: string;
  adventureId: string;
}): Promise<
  | { ok: true; alreadyFinished: boolean; awardedUserBadgeIds: string[] }
  | { ok: false; error: string }
> {
  const existing = await prisma.userAdventures.findFirst({
    where: { userId: input.userId, adventureId: input.adventureId },
    select: { success: true },
  });
  if (existing?.success) {
    return { ok: true, alreadyFinished: true, awardedUserBadgeIds: [] };
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: input.adventureId },
    select: {
      id: true,
      _count: { select: { enigmas: true } },
      treasure: { select: { id: true } },
    },
  });
  if (!adventure) {
    return { ok: false, error: "Aventure introuvable." };
  }
  if (adventure._count.enigmas === 0 && adventure.treasure == null) {
    return {
      ok: false,
      error: "Aventure sans énigme ni trésor : rien à finaliser.",
    };
  }

  const progress = await getPlayerAdventureProgressSnapshot(
    input.userId,
    input.adventureId
  );

  try {
    const fin = await prisma.$transaction(async (tx) => {
      if (!progress?.serverReadyForSuccessFinish) {
        await seedAllRequiredSteps(tx, input.userId, input.adventureId);
      } else {
        await ensureActivePlaySession(tx, input.userId, input.adventureId);
      }
      return processGameFinish(tx, {
        adventureId: input.adventureId,
        userId: input.userId,
        success: true,
      });
    });
    return {
      ok: true,
      alreadyFinished: false,
      awardedUserBadgeIds: fin.awardedUserBadgeIds,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue.";
    return { ok: false, error: msg };
  }
}

export async function superadminValidateAllProgressSteps(input: {
  userId: string;
  adventureId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const adventure = await prisma.adventure.findUnique({
    where: { id: input.adventureId },
    select: {
      _count: { select: { enigmas: true } },
      treasure: { select: { id: true } },
    },
  });
  if (!adventure) {
    return { ok: false, error: "Aventure introuvable." };
  }
  if (adventure._count.enigmas === 0 && adventure.treasure == null) {
    return { ok: false, error: "Aventure sans énigme ni trésor." };
  }
  try {
    await prisma.$transaction(async (tx) => {
      await seedAllRequiredSteps(tx, input.userId, input.adventureId);
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue.";
    return { ok: false, error: msg };
  }
}

export async function superadminValidateProgressStep(input: {
  userId: string;
  adventureId: string;
  stepKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const adventure = await prisma.adventure.findUnique({
    where: { id: input.adventureId },
    select: {
      enigmas: { select: { number: true }, orderBy: { number: "asc" } },
      treasure: { select: { id: true } },
    },
  });
  if (!adventure) {
    return { ok: false, error: "Aventure introuvable." };
  }
  const requiredEnigmaNumbers = adventure.enigmas.map((e) => e.number);
  const hasTreasure = adventure.treasure != null;
  if (
    !isAllowedStepKeyForAdventure(input.stepKey, requiredEnigmaNumbers, hasTreasure)
  ) {
    return { ok: false, error: "Étape inconnue pour cette aventure." };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!user) {
    return { ok: false, error: "Utilisateur introuvable." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await recordStepValidated(tx, input.userId, input.adventureId, input.stepKey);
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue.";
    return { ok: false, error: msg };
  }
}

export async function superadminUnvalidateProgressStep(input: {
  userId: string;
  adventureId: string;
  stepKey: string;
}): Promise<{ ok: true; revertedFinish: boolean } | { ok: false; error: string }> {
  const adventure = await prisma.adventure.findUnique({
    where: { id: input.adventureId },
    select: {
      enigmas: { select: { number: true }, orderBy: { number: "asc" } },
      treasure: { select: { id: true } },
    },
  });
  if (!adventure) {
    return { ok: false, error: "Aventure introuvable." };
  }
  const requiredEnigmaNumbers = adventure.enigmas.map((e) => e.number);
  const hasTreasure = adventure.treasure != null;
  if (
    !isAllowedStepKeyForAdventure(input.stepKey, requiredEnigmaNumbers, hasTreasure)
  ) {
    return { ok: false, error: "Étape inconnue pour cette aventure." };
  }

  try {
    let revertedFinish = false;
    await prisma.$transaction(async (tx) => {
      const ua = await tx.userAdventures.findFirst({
        where: { userId: input.userId, adventureId: input.adventureId },
        select: { success: true },
      });
      if (ua?.success) {
        await revertAdventureFinishArtifacts(tx, input.userId, input.adventureId);
        revertedFinish = true;
      }
      await tx.userAdventureStepValidation.deleteMany({
        where: {
          userId: input.userId,
          adventureId: input.adventureId,
          stepKey: input.stepKey,
        },
      });
    });
    return { ok: true, revertedFinish };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue.";
    return { ok: false, error: msg };
  }
}

export async function superadminResetAdventureProgress(input: {
  userId: string;
  adventureId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const adventure = await prisma.adventure.findUnique({
    where: { id: input.adventureId },
    select: { id: true },
  });
  if (!adventure) {
    return { ok: false, error: "Aventure introuvable." };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!user) {
    return { ok: false, error: "Utilisateur introuvable." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userAdventureStepValidation.deleteMany({
        where: { userId: input.userId, adventureId: input.adventureId },
      });
      await revertAdventureFinishArtifacts(tx, input.userId, input.adventureId);
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue.";
    return { ok: false, error: msg };
  }
}
