import "server-only";

import type { Prisma } from "../../../generated/prisma/client";
import { BadgeDefinitionKind } from "../../../generated/prisma/client";
import {
  publicCatalogAdventureWhere,
  userCanAccessAdventureForPlay,
} from "@/lib/adventure-public-access";
import { prisma } from "@/lib/prisma";

const definitionSelect = {
  id: true,
  slug: true,
  title: true,
  imageUrl: true,
  kind: true,
  adventureId: true,
  criteria: true,
  sortOrder: true,
} satisfies Prisma.BadgeDefinitionSelect;

type DefinitionRow = Prisma.BadgeDefinitionGetPayload<{
  select: typeof definitionSelect;
}>;

export type UserBadgeCatalogItem = DefinitionRow & {
  earned: boolean;
  earnedAt: string | null;
  userBadgeId: string | null;
};

export type UserBadgeCatalogGroup = {
  kind: BadgeDefinitionKind;
  items: UserBadgeCatalogItem[];
};

export type UserBadgeCatalogResult = {
  /** Sections par `kind` (kind → sortOrder → titre dans chaque groupe). */
  groups: UserBadgeCatalogGroup[];
};

function activePartnerAdvertisementWhere(now: Date): Prisma.AdvertisementWhereInput {
  return {
    active: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}

async function discoveryDefinitionsVisibleToUser(params: {
  userId: string;
  role: string | null | undefined;
}): Promise<DefinitionRow[]> {
  const rows = await prisma.badgeDefinition.findMany({
    where: { kind: BadgeDefinitionKind.DISCOVERY },
    select: {
      ...definitionSelect,
      discoveryPoint: {
        select: {
          adventureId: true,
          adventure: {
            select: { id: true, status: true, audience: true },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const out: DefinitionRow[] = [];
  for (const row of rows) {
    const point = row.discoveryPoint;
    if (!point) {
      continue;
    }
    if (!point.adventureId || !point.adventure) {
      out.push({
        id: row.id,
        slug: row.slug,
        title: row.title,
        imageUrl: row.imageUrl,
        kind: row.kind,
        adventureId: row.adventureId,
        criteria: row.criteria,
        sortOrder: row.sortOrder,
      });
      continue;
    }
    const adv = point.adventure;
    if (adv.status === false) {
      continue;
    }
    if (
      await userCanAccessAdventureForPlay(prisma, {
        userId: params.userId,
        role: params.role,
        adventure: adv,
      })
    ) {
      out.push({
        id: row.id,
        slug: row.slug,
        title: row.title,
        imageUrl: row.imageUrl,
        kind: row.kind,
        adventureId: row.adventureId,
        criteria: row.criteria,
        sortOrder: row.sortOrder,
      });
    }
  }
  return out;
}

/** Ordre d’affichage des groupes (aligné sur l’enum Prisma `BadgeDefinitionKind`). */
const BADGE_KIND_ORDER: readonly BadgeDefinitionKind[] = [
  BadgeDefinitionKind.ADVENTURE_COMPLETE,
  BadgeDefinitionKind.MILESTONE_ADVENTURES,
  BadgeDefinitionKind.MILESTONE_KM,
  BadgeDefinitionKind.SPECIAL_TIME_WINDOW,
  BadgeDefinitionKind.PERFORMANCE_STREAK,
  BadgeDefinitionKind.PERFORMANCE_MONTHLY_KM,
  BadgeDefinitionKind.PARTNER_OFFER,
  BadgeDefinitionKind.DISCOVERY,
];

function kindSortIndex(kind: BadgeDefinitionKind): number {
  const index = BADGE_KIND_ORDER.indexOf(kind);
  return index === -1 ? BADGE_KIND_ORDER.length : index;
}

function sortCatalogItems(a: UserBadgeCatalogItem, b: UserBadgeCatalogItem): number {
  const byKind = kindSortIndex(a.kind) - kindSortIndex(b.kind);
  if (byKind !== 0) {
    return byKind;
  }
  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }
  return a.title.localeCompare(b.title, "fr");
}

function groupCatalogItemsByKind(
  items: UserBadgeCatalogItem[]
): UserBadgeCatalogGroup[] {
  const groups: UserBadgeCatalogGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last?.kind === item.kind) {
      last.items.push(item);
    } else {
      groups.push({ kind: item.kind, items: [item] });
    }
  }
  return groups;
}

/** Catalogue complet (définitions éligibles) + état acquis pour un joueur. */
export async function listUserBadgeCatalog(params: {
  userId: string;
  role: string | null | undefined;
}): Promise<UserBadgeCatalogResult> {
  const now = new Date();

  const globalEvaluatorKinds = [
    BadgeDefinitionKind.MILESTONE_ADVENTURES,
    BadgeDefinitionKind.MILESTONE_KM,
    BadgeDefinitionKind.SPECIAL_TIME_WINDOW,
    BadgeDefinitionKind.PERFORMANCE_STREAK,
    BadgeDefinitionKind.PERFORMANCE_MONTHLY_KM,
  ] as const;

  const [milestonesAndAdventures, partnerOffers, discovery] = await Promise.all([
    prisma.badgeDefinition.findMany({
      where: {
        OR: [
          {
            kind: { in: [...globalEvaluatorKinds] },
            adventureId: null,
          },
          {
            kind: BadgeDefinitionKind.ADVENTURE_COMPLETE,
            adventure: publicCatalogAdventureWhere,
          },
        ],
      },
      select: definitionSelect,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
    prisma.badgeDefinition.findMany({
      where: {
        kind: BadgeDefinitionKind.PARTNER_OFFER,
        partnerAdvertisement: activePartnerAdvertisementWhere(now),
      },
      select: definitionSelect,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
    discoveryDefinitionsVisibleToUser(params),
  ]);

  const byId = new Map<string, DefinitionRow>();
  for (const row of [...milestonesAndAdventures, ...partnerOffers, ...discovery]) {
    byId.set(row.id, row);
  }

  const earnedRows = await prisma.userBadge.findMany({
    where: { userId: params.userId },
    select: {
      id: true,
      badgeDefinitionId: true,
      earnedAt: true,
    },
  });

  const earnedByDefId = new Map(
    earnedRows.map((e) => [e.badgeDefinitionId, e] as const)
  );

  const orphanDefIds = earnedRows
    .map((e) => e.badgeDefinitionId)
    .filter((id) => !byId.has(id));
  if (orphanDefIds.length > 0) {
    const orphanDefs = await prisma.badgeDefinition.findMany({
      where: { id: { in: orphanDefIds } },
      select: definitionSelect,
    });
    for (const def of orphanDefs) {
      byId.set(def.id, def);
    }
  }

  const items: UserBadgeCatalogItem[] = [...byId.values()].map((def) => {
    const earned = earnedByDefId.get(def.id);
    return {
      ...def,
      earned: Boolean(earned),
      earnedAt: earned?.earnedAt.toISOString() ?? null,
      userBadgeId: earned?.id ?? null,
    };
  });

  items.sort(sortCatalogItems);
  return { groups: groupCatalogItemsByKind(items) };
}
