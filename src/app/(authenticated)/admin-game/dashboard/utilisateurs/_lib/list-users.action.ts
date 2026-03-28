"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { roleHasRoutePermission } from "@/lib/permissions";

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

/** Réponse plate ou enveloppée (`data`) selon la version Better Auth / better-call. */
function normalizeListUsersResponse(res: unknown): {
  users: ListUsersApiEntry[];
  total: number;
} {
  if (!res || typeof res !== "object") {
    return { users: [], total: 0 };
  }
  const r = res as Record<string, unknown>;
  const inner =
    r.data !== undefined && typeof r.data === "object" && r.data !== null
      ? (r.data as Record<string, unknown>)
      : r;
  const users = Array.isArray(inner.users) ? (inner.users as ListUsersApiEntry[]) : [];
  const total = typeof inner.total === "number" ? inner.total : 0;
  return { users, total };
}

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
 * Liste paginée : `auth.api.listUsers` (plugin admin Better Auth) sans recherche ;
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
    roleHasRoutePermission(user.role, "user", "list") ||
    roleHasRoutePermission(user.role, "user", "get");
  if (!canList) {
    return { ok: false, error: "Non autorisé." };
  }

  const skip = (params.page - 1) * params.pageSize;
  const q = params.search.trim();

  try {
    if (q.length === 0) {
      const res = await auth.api.listUsers({
        query: {
          limit: params.pageSize,
          offset: skip,
          sortBy: "name",
          sortDirection: "asc",
        },
        headers: await headers(),
      });
      const { users: rawUsers, total } = normalizeListUsersResponse(res);
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
