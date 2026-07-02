"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { gateAdventureUpdateContent } from "@/lib/adventure-authorization";

const MESSAGE_MAX = 500;

export async function setTreasureUnavailableNotice(
  adventureId: string,
  message: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { treasure: { select: { id: true } } },
  });
  if (!adventure?.treasure) {
    return { success: false, error: "Cette aventure n’a pas de trésor configuré." };
  }

  const trimmed = message.trim();
  if (trimmed.length > MESSAGE_MAX) {
    return {
      success: false,
      error: `Le message ne doit pas dépasser ${MESSAGE_MAX} caractères.`,
    };
  }

  await prisma.adventure.update({
    where: { id: adventureId },
    data: {
      treasureUnavailable: true,
      treasureUnavailableMessage: trimmed.length > 0 ? trimmed : null,
      treasureUnavailableUpdatedAt: new Date(),
    },
  });

  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  return { success: true };
}

export async function clearTreasureUnavailableNotice(
  adventureId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }

  await prisma.adventure.update({
    where: { id: adventureId },
    data: {
      treasureUnavailable: false,
      treasureUnavailableMessage: null,
      treasureUnavailableUpdatedAt: null,
    },
  });

  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  return { success: true };
}

export type TreasureUnavailableNoticeAdmin = {
  active: boolean;
  message: string | null;
  updatedAt: string | null;
};

export async function getTreasureUnavailableNoticeForAdmin(
  adventureId: string
): Promise<TreasureUnavailableNoticeAdmin | null> {
  const row = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: {
      treasureUnavailable: true,
      treasureUnavailableMessage: true,
      treasureUnavailableUpdatedAt: true,
    },
  });
  if (!row) {
    return null;
  }
  return {
    active: row.treasureUnavailable,
    message: row.treasureUnavailableMessage,
    updatedAt: row.treasureUnavailableUpdatedAt?.toISOString() ?? null,
  };
}
