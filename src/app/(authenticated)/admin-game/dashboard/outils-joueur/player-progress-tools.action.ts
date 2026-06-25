"use server";

import { isSuperadmin } from "@/lib/admin-access";
import { getUser } from "@/lib/auth/auth-user";
import type { AdventureReviewModerationStatus } from "@/lib/badges/prisma-enums";
import {
  getPlayerAdventureProgressSnapshot,
  superadminDeleteAdventureReview,
  superadminForceCompleteAdventure,
  superadminResetAdventureProgress,
  superadminUnvalidateProgressStep,
  superadminUpsertAdventureReview,
  superadminValidateAllProgressSteps,
  superadminValidateProgressStep,
} from "@/lib/game/superadmin-player-progress-tools";
import { prisma } from "@/lib/prisma";
import { adventureAudienceToForm } from "@/lib/adventure-audience-server";

async function requireSuperadminActor() {
  const user = await getUser();
  if (!user || !isSuperadmin(user.role)) {
    return null;
  }
  return user;
}

export async function searchUsersForProgressTools(query: string) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  const q = query.trim();
  if (q.length < 2) {
    return { ok: true as const, users: [] };
  }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { email: "asc" },
    take: 15,
  });
  return { ok: true as const, users };
}

export async function searchAdventuresForProgressTools(query: string) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  const q = query.trim();
  const where =
    q.length >= 2
      ? { name: { contains: q, mode: "insensitive" as const } }
      : {};
  const adventures = await prisma.adventure.findMany({
    where,
    select: { id: true, name: true, status: true, audience: true },
    orderBy: { name: "asc" },
    take: q.length >= 2 ? 15 : 30,
  });
  return {
    ok: true as const,
    adventures: adventures.map((a) => ({
      ...a,
      audience: adventureAudienceToForm(a.audience),
    })),
  };
}

export async function loadPlayerAdventureProgress(userId: string, adventureId: string) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!userId || !adventureId) {
    return { ok: false as const, error: "Joueur et aventure requis." };
  }
  const snapshot = await getPlayerAdventureProgressSnapshot(userId, adventureId);
  if (!snapshot) {
    return { ok: false as const, error: "Joueur ou aventure introuvable." };
  }
  return { ok: true as const, snapshot };
}

export async function forceCompletePlayerAdventure(userId: string, adventureId: string) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!userId || !adventureId) {
    return { ok: false as const, error: "Joueur et aventure requis." };
  }
  const result = await superadminForceCompleteAdventure({ userId, adventureId });
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }
  const snapshot = await getPlayerAdventureProgressSnapshot(userId, adventureId);
  return {
    ok: true as const,
    alreadyFinished: result.alreadyFinished,
    awardedUserBadgeIds: result.awardedUserBadgeIds,
    snapshot: snapshot ?? null,
  };
}

export async function validateAllPlayerProgressSteps(userId: string, adventureId: string) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!userId || !adventureId) {
    return { ok: false as const, error: "Joueur et aventure requis." };
  }
  const result = await superadminValidateAllProgressSteps({ userId, adventureId });
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }
  const snapshot = await getPlayerAdventureProgressSnapshot(userId, adventureId);
  return { ok: true as const, snapshot: snapshot ?? null };
}

export async function validatePlayerProgressStep(
  userId: string,
  adventureId: string,
  stepKey: string
) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!userId || !adventureId || !stepKey) {
    return { ok: false as const, error: "Joueur, aventure et étape requis." };
  }
  const result = await superadminValidateProgressStep({ userId, adventureId, stepKey });
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }
  const snapshot = await getPlayerAdventureProgressSnapshot(userId, adventureId);
  return { ok: true as const, snapshot: snapshot ?? null };
}

export async function unvalidatePlayerProgressStep(
  userId: string,
  adventureId: string,
  stepKey: string
) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!userId || !adventureId || !stepKey) {
    return { ok: false as const, error: "Joueur, aventure et étape requis." };
  }
  const result = await superadminUnvalidateProgressStep({ userId, adventureId, stepKey });
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }
  const snapshot = await getPlayerAdventureProgressSnapshot(userId, adventureId);
  return {
    ok: true as const,
    revertedFinish: result.revertedFinish,
    snapshot: snapshot ?? null,
  };
}

export async function savePlayerAdventureReviewSimulation(input: {
  userId: string;
  adventureId: string;
  rating: number | null;
  content: string;
  reportsMissingBadge: boolean;
  reportsStolenTreasure: boolean;
  consentCommunicationNetworks: boolean;
  moderationStatus: AdventureReviewModerationStatus;
}) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!input.userId || !input.adventureId) {
    return { ok: false as const, error: "Joueur et aventure requis." };
  }
  const result = await superadminUpsertAdventureReview(input);
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }
  const snapshot = await getPlayerAdventureProgressSnapshot(
    input.userId,
    input.adventureId
  );
  return { ok: true as const, reviewId: result.reviewId, snapshot: snapshot ?? null };
}

export async function deletePlayerAdventureReview(userId: string, adventureId: string) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!userId || !adventureId) {
    return { ok: false as const, error: "Joueur et aventure requis." };
  }
  const result = await superadminDeleteAdventureReview({ userId, adventureId });
  if (!result.ok) {
    return { ok: false as const, error: "Erreur lors de la suppression." };
  }
  const snapshot = await getPlayerAdventureProgressSnapshot(userId, adventureId);
  return { ok: true as const, snapshot: snapshot ?? null };
}

export async function resetPlayerAdventureProgress(userId: string, adventureId: string) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { ok: false as const, error: "Non autorisé." };
  }
  if (!userId || !adventureId) {
    return { ok: false as const, error: "Joueur et aventure requis." };
  }
  const result = await superadminResetAdventureProgress({ userId, adventureId });
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }
  const snapshot = await getPlayerAdventureProgressSnapshot(userId, adventureId);
  return { ok: true as const, snapshot: snapshot ?? null };
}
