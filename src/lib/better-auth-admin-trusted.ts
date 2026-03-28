import "server-only";

import { generateId } from "@better-auth/core/utils/id";
import { hashPassword } from "better-auth/crypto";
import {
  DEFAULT_ADMIN_BAN_REASON,
  DEFAULT_MAX_PASSWORD_LENGTH,
  DEFAULT_MIN_PASSWORD_LENGTH,
} from "@/lib/better-auth-shared-constants";
import { prisma } from "@/lib/prisma";

function banExpiresFromSeconds(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

function parseRoles(role: string | string[]): string {
  return Array.isArray(role) ? role.join(",") : role;
}

function banExpiresFromBody(banExpiresIn?: number): Date | null {
  if (banExpiresIn === undefined || banExpiresIn === null) return null;
  return banExpiresFromSeconds(banExpiresIn);
}

export async function trustedBanUser(params: {
  userId: string;
  sessionUserId: string;
  banReason?: string;
  banExpiresIn?: number;
}) {
  if (params.userId === params.sessionUserId) {
    throw new Error("Vous ne pouvez pas bannir votre propre compte.");
  }
  const exists = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true },
  });
  if (!exists) {
    throw new Error("Utilisateur introuvable.");
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: params.userId },
      data: {
        banned: true,
        banReason: params.banReason ?? DEFAULT_ADMIN_BAN_REASON,
        banExpires: banExpiresFromBody(params.banExpiresIn),
        updatedAt: new Date(),
      },
    }),
    prisma.session.deleteMany({ where: { userId: params.userId } }),
  ]);
}

export async function trustedUnbanUser(params: {
  userId: string;
}) {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      banned: false,
      banReason: null,
      banExpires: null,
      updatedAt: new Date(),
    },
  });
}

const ADMIN_UPDATABLE_USER_FIELDS = [
  "name",
  "address",
  "postalCode",
  "city",
  "country",
  "phone",
] as const;

export async function trustedAdminUpdateUser(params: {
  userId: string;
  data: Record<string, unknown>;
}) {
  const data: Record<string, string | null | undefined> = {};
  for (const key of ADMIN_UPDATABLE_USER_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(params.data, key)) {
      const v = params.data[key];
      data[key] = typeof v === "string" ? v : v == null ? null : String(v);
    }
  }
  if (Object.keys(data).length === 0) {
    throw new Error("Aucune donnée à mettre à jour.");
  }
  return prisma.user.update({
    where: { id: params.userId },
    data,
  });
}

export async function trustedGetUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function trustedListUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function trustedRevokeUserSession(sessionToken: string) {
  await prisma.session.deleteMany({ where: { token: sessionToken } });
}

export async function trustedRevokeUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function trustedRemoveUser(params: {
  userId: string;
  sessionUserId: string;
}) {
  if (params.userId === params.sessionUserId) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  }
  const exists = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true },
  });
  if (!exists) {
    throw new Error("Utilisateur introuvable.");
  }
  await prisma.user.delete({ where: { id: params.userId } });
}

export async function trustedSetUserPassword(params: {
  userId: string;
  newPassword: string;
}) {
  if (params.newPassword.length < DEFAULT_MIN_PASSWORD_LENGTH) {
    throw new Error("Mot de passe trop court.");
  }
  if (params.newPassword.length > DEFAULT_MAX_PASSWORD_LENGTH) {
    throw new Error("Mot de passe trop long.");
  }
  const hashed = await hashPassword(params.newPassword);
  const updated = await prisma.account.updateMany({
    where: { userId: params.userId, providerId: "credential" },
    data: { password: hashed, updatedAt: new Date() },
  });
  if (updated.count === 0) {
    throw new Error("Aucun compte mot de passe pour cet utilisateur.");
  }
}

export async function trustedSetRole(params: {
  userId: string;
  role: string | string[];
}) {
  const roleStr = parseRoles(params.role);
  await prisma.user.update({
    where: { id: params.userId },
    data: { role: roleStr, updatedAt: new Date() },
  });
}

const CREATE_USER_EXTRA_FIELDS = [
  "city",
  "address",
  "postalCode",
  "country",
  "phone",
  "image",
] as const;

type PickedCreateUserData = {
  emailVerified: boolean;
  city?: string | null;
  address?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
  image?: string | null;
};

function pickCreateUserData(data?: Record<string, unknown>): PickedCreateUserData {
  const emailVerified =
    data && Object.prototype.hasOwnProperty.call(data, "emailVerified")
      ? Boolean(data.emailVerified)
      : false;
  const out: PickedCreateUserData = { emailVerified };
  if (!data) return out;
  for (const key of CREATE_USER_EXTRA_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const v = data[key];
    const val: string | null =
      typeof v === "string" ? v : v == null ? null : String(v);
    if (key === "city") out.city = val;
    else if (key === "address") out.address = val;
    else if (key === "postalCode") out.postalCode = val;
    else if (key === "country") out.country = val;
    else if (key === "phone") out.phone = val;
    else if (key === "image") out.image = val;
  }
  return out;
}

export async function trustedCreateUser(params: {
  email: string;
  password: string;
  name: string;
  role: string;
  data?: Record<string, unknown>;
}) {
  const email = params.email.toLowerCase().trim();
  const dup = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (dup) {
    throw new Error("Un compte existe déjà avec cette adresse e-mail.");
  }
  const userId = generateId();
  const accountId = generateId();
  const hashed = await hashPassword(params.password);
  const extra = pickCreateUserData(params.data);
  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        email,
        name: params.name.trim(),
        role: params.role,
        emailVerified: extra.emailVerified,
        ...(extra.city !== undefined && { city: extra.city }),
        ...(extra.address !== undefined && { address: extra.address }),
        ...(extra.postalCode !== undefined && { postalCode: extra.postalCode }),
        ...(extra.country !== undefined && { country: extra.country }),
        ...(extra.phone !== undefined && { phone: extra.phone }),
        ...(extra.image !== undefined && { image: extra.image }),
      },
    });
    await tx.account.create({
      data: {
        id: accountId,
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashed,
      },
    });
  });
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
}
