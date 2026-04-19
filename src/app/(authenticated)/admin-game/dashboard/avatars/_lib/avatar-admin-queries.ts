import "server-only";

import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";

export type AvatarAdminListRow = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  thumbnailUrl: string | null;
  modelUrl: string | null;
  selectedByUserCount: number;
};

export async function listAvatarsForAdmin(): Promise<AvatarAdminListRow[] | null> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return null;
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return null;
  }

  const rows = await prisma.avatar.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      sortOrder: true,
      isActive: true,
      thumbnailUrl: true,
      modelUrl: true,
      _count: { select: { usersWithThisAvatarSelected: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    thumbnailUrl: r.thumbnailUrl,
    modelUrl: r.modelUrl,
    selectedByUserCount: r._count.usersWithThisAvatarSelected,
  }));
}

export type AvatarAdminEditPayload = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  thumbnailUrl: string | null;
  modelUrl: string | null;
};

export async function getAvatarForAdminEdit(id: string): Promise<AvatarAdminEditPayload | null> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return null;
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return null;
  }

  const row = await prisma.avatar.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      sortOrder: true,
      isActive: true,
      thumbnailUrl: true,
      modelUrl: true,
    },
  });
  return row;
}
