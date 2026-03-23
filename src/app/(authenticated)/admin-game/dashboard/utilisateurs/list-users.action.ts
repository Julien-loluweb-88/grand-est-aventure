"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";

const ADMIN_ROLES = ["admin", "superadmin"] as const;

export type ListUsersAdminRow = {
  id: string;
  name: string | null;
  email: string;
  role: string | undefined;
  banned: boolean;
};

export async function listUsersForAdmin(params: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<
  { ok: true; users: ListUsersAdminRow[]; total: number } | { ok: false; error: string }
> {
  const user = await getUser();
  if (!user || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
    return { ok: false, error: "Non autorisé." };
  }

  const skip = (params.page - 1) * params.pageSize;
  const q = params.search.trim();

  const where =
    q.length > 0
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

  try {
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
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role ?? undefined,
        banned: u.banned ?? false,
      })),
      total,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors du chargement des utilisateurs.",
    };
  }
}
