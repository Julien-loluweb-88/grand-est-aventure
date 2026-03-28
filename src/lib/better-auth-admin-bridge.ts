import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import * as trusted from "@/lib/better-auth-admin-trusted";

async function isImpersonatingSession(): Promise<boolean> {
  const s = await auth.api.getSession({ headers: await headers() });
  const ib =
    s?.session &&
    typeof s.session === "object" &&
    "impersonatedBy" in s.session
      ? (s.session as { impersonatedBy?: string | null }).impersonatedBy
      : undefined;
  return Boolean(ib);
}

async function getSessionUserId(): Promise<string | undefined> {
  const s = await auth.api.getSession({ headers: await headers() });
  return s?.user?.id;
}

/** Appels plugin admin : sous impersonation, exécution Prisma alignée sur Better Auth (même schéma / hash). */
export async function bridgeBanUser(body: {
  userId: string;
  banReason?: string;
  banExpiresIn?: number;
}) {
  const h = await headers();
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) throw new Error("Non authentifié.");
  if (await isImpersonatingSession()) {
    await trusted.trustedBanUser({
      userId: body.userId,
      sessionUserId,
      banReason: body.banReason,
      banExpiresIn: body.banExpiresIn,
    });
    return;
  }
  await auth.api.banUser({ body, headers: h });
}

export async function bridgeUnbanUser(body: { userId: string }) {
  const h = await headers();
  if (await isImpersonatingSession()) {
    await trusted.trustedUnbanUser(body);
    return;
  }
  await auth.api.unbanUser({ body, headers: h });
}

export async function bridgeAdminUpdateUser(body: {
  userId: string;
  data: Record<string, unknown>;
}) {
  const h = await headers();
  if (await isImpersonatingSession()) {
    return trusted.trustedAdminUpdateUser(body);
  }
  return auth.api.adminUpdateUser({ body, headers: h });
}

export async function bridgeGetUser(query: { id: string }) {
  const h = await headers();
  if (await isImpersonatingSession()) {
    return trusted.trustedGetUserById(query.id);
  }
  return auth.api.getUser({ query, headers: h });
}

export async function bridgeListUserSessions(body: { userId: string }) {
  const h = await headers();
  if (await isImpersonatingSession()) {
    const rows = await trusted.trustedListUserSessions(body.userId);
    return {
      sessions: rows.map((s) => ({
        id: s.id,
        token: s.token,
        userId: s.userId,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        impersonatedBy: s.impersonatedBy,
      })),
    };
  }
  return auth.api.listUserSessions({ body, headers: h });
}

export async function bridgeRevokeUserSession(body: { sessionToken: string }) {
  const h = await headers();
  if (await isImpersonatingSession()) {
    await trusted.trustedRevokeUserSession(body.sessionToken);
    return;
  }
  await auth.api.revokeUserSession({ body, headers: h });
}

export async function bridgeRevokeUserSessions(body: { userId: string }) {
  const h = await headers();
  if (await isImpersonatingSession()) {
    await trusted.trustedRevokeUserSessions(body.userId);
    return;
  }
  await auth.api.revokeUserSessions({ body, headers: h });
}

export async function bridgeRemoveUser(body: { userId: string }) {
  const h = await headers();
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) throw new Error("Non authentifié.");
  if (await isImpersonatingSession()) {
    await trusted.trustedRemoveUser({
      userId: body.userId,
      sessionUserId,
    });
    return;
  }
  await auth.api.removeUser({ body, headers: h });
}

export async function bridgeSetUserPassword(body: {
  userId: string;
  newPassword: string;
}) {
  const h = await headers();
  if (await isImpersonatingSession()) {
    await trusted.trustedSetUserPassword(body);
    return;
  }
  await auth.api.setUserPassword({ body, headers: h });
}

export async function bridgeSetRole(body: {
  userId: string;
  role: string | string[];
}) {
  const h = await headers();
  if (await isImpersonatingSession()) {
    await trusted.trustedSetRole(body);
    return;
  }
  await auth.api.setRole({
    body: body as {
      userId: string;
      role:
        | "user"
        | "admin"
        | "superadmin"
        | "myCustomRole"
        | ("user" | "admin" | "superadmin" | "myCustomRole")[];
    },
    headers: h,
  });
}

export async function bridgeCreateUser(body: {
  email: string;
  password: string;
  name: string;
  role: string;
  data?: Record<string, unknown>;
}) {
  const h = await headers();
  if (await isImpersonatingSession()) {
    const user = await trusted.trustedCreateUser({
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role,
      data: body.data,
    });
    return { user };
  }
  return auth.api.createUser({
    body: {
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role as "user" | "admin" | "myCustomRole",
      data: body.data,
    },
    headers: h,
  });
}

export type ListUsersBridgeResult = {
  users: {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    banned: boolean | null;
  }[];
  total: number;
};

function normalizeListUsersResponse(res: unknown): ListUsersBridgeResult {
  if (!res || typeof res !== "object") {
    return { users: [], total: 0 };
  }
  const r = res as Record<string, unknown>;
  const inner =
    r.data !== undefined && typeof r.data === "object" && r.data !== null
      ? (r.data as Record<string, unknown>)
      : r;
  const raw = Array.isArray(inner.users) ? inner.users : [];
  const users = raw.map((u) => {
    const x = u as Record<string, unknown>;
    return {
      id: String(x.id),
      name: (x.name as string | null | undefined) ?? null,
      email: String(x.email),
      role: (x.role as string | null | undefined) ?? null,
      banned: (x.banned as boolean | null | undefined) ?? null,
    };
  });
  const total = typeof inner.total === "number" ? inner.total : 0;
  return { users, total };
}

export async function bridgeListUsers(query: {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<ListUsersBridgeResult> {
  const h = await headers();
  if (await isImpersonatingSession()) {
    const limit = Number(query.limit) || 100;
    const offset = Number(query.offset) || 0;
    const sortBy = query.sortBy === "name" ? "name" : "name";
    const dir = query.sortDirection === "desc" ? "desc" : "asc";
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { [sortBy]: dir },
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          banned: true,
        },
      }),
      prisma.user.count(),
    ]);
    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        banned: u.banned,
      })),
      total,
    };
  }
  const res = await auth.api.listUsers({ query, headers: h });
  return normalizeListUsersResponse(res);
}
