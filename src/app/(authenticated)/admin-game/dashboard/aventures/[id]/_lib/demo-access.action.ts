"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  gateAdventureAction,
  gateAdventureUpdateContent,
} from "@/lib/adventure-authorization";

export async function listAdventureDemoAccess(adventureId: string) {
  const gate = await gateAdventureAction(adventureId, "read");
  if (!gate.ok) {
    return null;
  }
  return prisma.adventureDemoAccess.findMany({
    where: { adventureId },
    select: {
      id: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addAdventureDemoAccess(
  adventureId: string,
  emailRaw: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { ok: false, error: "Non autorisé." };
  }
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "E-mail invalide." };
  }
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return { ok: false, error: "Aucun compte avec cet e-mail." };
  }
  try {
    await prisma.adventureDemoAccess.create({
      data: { adventureId, userId: user.id },
    });
  } catch {
    return {
      ok: false,
      error: "Ce compte est déjà autorisé pour cette aventure.",
    };
  }
  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  return { ok: true };
}

export async function removeAdventureDemoAccess(
  adventureId: string,
  accessId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { ok: false, error: "Non autorisé." };
  }
  const n = await prisma.adventureDemoAccess.deleteMany({
    where: { id: accessId, adventureId },
  });
  if (n.count === 0) {
    return { ok: false, error: "Entrée introuvable." };
  }
  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  return { ok: true };
}
