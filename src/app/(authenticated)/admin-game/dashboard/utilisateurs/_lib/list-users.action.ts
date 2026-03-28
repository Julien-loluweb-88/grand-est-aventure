"use server";

import { prisma } from "@/lib/prisma";
import { bridgeListUsers } from "@/lib/better-auth-admin-bridge";
import { getUser } from "@/lib/auth/auth-user";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";

export type ListUsersAdminRow = {
  id: string;
  name: string | null;
  email: string;
  role: string | undefined;
  banned: boolean;
};

type ListUsersApiEntry = {
  id: string;
  name?: string | null;
  email: string;
  role?: string | null;
  banned?: boolean | null;
};

function mapToRow(u: ListUsersApiEntry): ListUsersAdminRow {
  return {
    id: u.id,
    name: u.name ?? null,
    email: u.email,
    role: u.role ?? undefined,
    banned: u.banned ?? false,
  };
}

/**
 * Liste paginée : `bridgeListUsers` (API admin ou Prisma sous impersonation) sans recherche ;
 * recherche nom **ou** e-mail via Prisma (l’API admin n’expose qu’un seul `searchField` à la fois).
 */
export async function listUsersForAdmin(params: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<
  { ok: true; users: ListUsersAdminRow[]; total: number } | { ok: false; error: string }
> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "Non autorisé." };
  }
  const canList =
    (await userHasPermissionServer({ permissions: { user: ["list"] } })) ||
    (await userHasPermissionServer({ permissions: { user: ["get"] } }));
  if (!canList) {
    return { ok: false, error: "Non autorisé." };
  }

  const skip = (params.page - 1) * params.pageSize;
  const q = params.search.trim();

  try {
    if (q.length === 0) {
      const { users: rawUsers, total } = await bridgeListUsers({
        limit: params.pageSize,
        offset: skip,
        sortBy: "name",
        sortDirection: "asc",
      });
      return {
        ok: true,
        users: rawUsers.map((u) => mapToRow(u)),
        total,
      };
    }

    const where = {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          banned: true,
        },
        orderBy: { name: "asc" },
        skip,
        take: params.pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      ok: true,
      users: users.map((u) => mapToRow(u)),
      total,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors du chargement des utilisateurs.",
    };
  }
}
