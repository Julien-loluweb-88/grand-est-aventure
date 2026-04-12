import "server-only";

import { prisma } from "@/lib/prisma";

/** Slug URL-safe à partir du libellé (sans garantie d’unicité). */
export function slugifyMilestoneBadgeTitle(title: string): string {
  const t = title.normalize("NFD").replace(/\p{M}/gu, "");
  let s = t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!s) s = "badge";
  return s;
}

/**
 * Slug unique pour `BadgeDefinition` : base dérivée du titre, puis `-1`, `-2`, … si collision.
 */
export async function allocateUniqueMilestoneBadgeSlug(
  title: string,
  excludeDefinitionId?: string
): Promise<string> {
  const base = slugifyMilestoneBadgeTitle(title);
  let slug = base;
  let counter = 0;
  for (;;) {
    const clash = await prisma.badgeDefinition.findFirst({
      where: {
        slug,
        ...(excludeDefinitionId ? { NOT: { id: excludeDefinitionId } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}
