import "server-only";

import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";

const MILESTONE_KINDS: BadgeDefinitionKind[] = [
  BadgeDefinitionKind.MILESTONE_ADVENTURES,
  BadgeDefinitionKind.MILESTONE_KM,
];

export type MilestoneBadgeListRow = {
  id: string;
  slug: string;
  title: string;
  kind: BadgeDefinitionKind;
  criteria: unknown;
  imageUrl: string | null;
  sortOrder: number;
  earnedCount: number;
};

export async function listMilestoneBadgesForAdmin(): Promise<
  MilestoneBadgeListRow[] | null
> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return null;
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return null;
  }
  const rows = await prisma.badgeDefinition.findMany({
    where: {
      kind: { in: MILESTONE_KINDS },
      adventureId: null,
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      kind: true,
      criteria: true,
      imageUrl: true,
      sortOrder: true,
      _count: { select: { userBadges: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    kind: r.kind,
    criteria: r.criteria,
    imageUrl: r.imageUrl,
    sortOrder: r.sortOrder,
    earnedCount: r._count.userBadges,
  }));
}

export async function getMilestoneBadgeForAdminEdit(
  id: string
): Promise<
  | {
      ok: true;
      row: {
        id: string;
        slug: string;
        title: string;
        kind: BadgeDefinitionKind;
        criteria: unknown;
        imageUrl: string | null;
        sortOrder: number;
      };
    }
  | { ok: false; reason: "auth" | "missing" | "not_milestone" }
> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return { ok: false, reason: "auth" };
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return { ok: false, reason: "auth" };
  }
  const row = await prisma.badgeDefinition.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      kind: true,
      criteria: true,
      imageUrl: true,
      sortOrder: true,
      adventureId: true,
    },
  });
  if (!row || row.adventureId != null) {
    return { ok: false, reason: "missing" };
  }
  if (!MILESTONE_KINDS.includes(row.kind)) {
    return { ok: false, reason: "not_milestone" };
  }
  return {
    ok: true,
    row: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      kind: row.kind,
      criteria: row.criteria,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
    },
  };
}
