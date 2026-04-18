import "server-only";

import type { Prisma } from "../../../generated/prisma/client";
import { UserAdventurePlaySessionStatus } from "../../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Crée une session « en cours » si aucune n’existe pour ce joueur et cette aventure. @returns true si une ligne a été créée. */
export async function ensureActivePlaySession(
  tx: Tx,
  userId: string,
  adventureId: string
): Promise<boolean> {
  const open = await tx.userAdventurePlaySession.findFirst({
    where: {
      userId,
      adventureId,
      status: UserAdventurePlaySessionStatus.IN_PROGRESS,
    },
    select: { id: true },
  });
  if (open) {
    return false;
  }
  await tx.userAdventurePlaySession.create({
    data: {
      userId,
      adventureId,
      status: UserAdventurePlaySessionStatus.IN_PROGRESS,
    },
  });
  return true;
}

/** Clôture la session active (succès ou échec) et enregistre la durée en secondes. */
export async function closeActivePlaySession(
  tx: Tx,
  userId: string,
  adventureId: string,
  input: { success: boolean }
): Promise<void> {
  const open = await tx.userAdventurePlaySession.findFirst({
    where: {
      userId,
      adventureId,
      status: UserAdventurePlaySessionStatus.IN_PROGRESS,
    },
    orderBy: { startedAt: "desc" },
    select: { id: true, startedAt: true },
  });
  if (!open) {
    return;
  }
  const endedAt = new Date();
  const durationSeconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - open.startedAt.getTime()) / 1000)
  );
  await tx.userAdventurePlaySession.update({
    where: { id: open.id },
    data: {
      endedAt,
      durationSeconds,
      status: input.success
        ? UserAdventurePlaySessionStatus.COMPLETED_SUCCESS
        : UserAdventurePlaySessionStatus.COMPLETED_FAILURE,
    },
  });
}
