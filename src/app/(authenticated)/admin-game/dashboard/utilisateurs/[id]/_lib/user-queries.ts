import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { bridgeGetUser, bridgeListUserSessions } from "@/lib/better-auth-admin-bridge";
import {
  requireRoutePermission,
  requireSuperadmin,
  requireUserPermission,
} from "./user-admin-guard";

export type UserSessionRow = {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  impersonatedBy: string | null;
  isCurrent: boolean;
};

export async function getUserById(id: string) {
  await requireUserPermission("get");
  return bridgeGetUser({ id });
}

export type UserSelectedAvatarSummary = {
  selectedAvatarId: string | null;
  avatar: {
    id: string;
    slug: string;
    name: string;
    thumbnailUrl: string | null;
    modelUrl: string | null;
  } | null;
};

/** Préférence avatar jeu (Prisma) — complément à `bridgeGetUser` qui n’expose pas cette relation. */
export async function getUserSelectedAvatarForAdmin(
  userId: string
): Promise<UserSelectedAvatarSummary | null> {
  try {
    await requireUserPermission("get");
  } catch {
    return null;
  }
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      selectedAvatarId: true,
      selectedAvatar: {
        select: {
          id: true,
          slug: true,
          name: true,
          thumbnailUrl: true,
          modelUrl: true,
        },
      },
    },
  });
  if (!row) {
    return null;
  }
  return {
    selectedAvatarId: row.selectedAvatarId,
    avatar: row.selectedAvatar,
  };
}

export async function getAdminAdventureRights(userId: string) {
  await requireSuperadmin();

  const [allAdventures, assignedAccesses] = await Promise.all([
    prisma.adventure.findMany({
      select: {
        id: true,
        name: true,
        city: { select: { name: true } },
      },
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.adminAdventureAccess.findMany({
      where: { userId },
      select: { adventureId: true },
    }),
  ]);

  return {
    adventures: allAdventures.map((a) => ({
      id: a.id,
      name: a.name,
      city: a.city.name,
    })),
    assignedAdventureIds: assignedAccesses.map((access) => access.adventureId),
  };
}

function toIso(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  return typeof d === "string" ? d : new Date(d).toISOString();
}

export async function getUserSessionsForAdminPage(
  userId: string
): Promise<UserSessionRow[] | null> {
  try {
    await requireRoutePermission("session", "list");
  } catch {
    return null;
  }
  const h = await headers();
  const [actor, listRes] = await Promise.all([
    auth.api.getSession({ headers: h }),
    bridgeListUserSessions({ userId }),
  ]);
  const actorToken = actor?.session?.token ?? null;
  const sessions = listRes?.sessions ?? [];
  return sessions.map((s) => ({
    id: s.id,
    createdAt: toIso(s.createdAt),
    expiresAt: toIso(s.expiresAt),
    ipAddress: s.ipAddress ?? null,
    userAgent: s.userAgent ?? null,
    impersonatedBy: s.impersonatedBy ?? null,
    isCurrent: actorToken !== null && s.token === actorToken,
  }));
}
