import "server-only";

import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBetterAuthServerBaseUrl } from "@/lib/public-app-url";

const FORWARDED_HEADER_NAMES = ["authorization", "cookie", "expo-origin"] as const;

function parseBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token || null;
}

async function buildAuthHeaders(request: NextRequest): Promise<Headers> {
  const merged = new Headers(await headers());
  for (const name of FORWARDED_HEADER_NAMES) {
    const value = request.headers.get(name);
    if (value) {
      merged.set(name, value);
    }
  }
  return merged;
}

async function resolveUserIdFromSessionHeaders(
  authHeaders: Headers,
): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: authHeaders });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    /* session invalide */
  }
  return null;
}

async function resolveUserIdFromBearerToken(token: string): Promise<string | null> {
  const row = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });
  if (!row || row.expiresAt <= new Date()) {
    return null;
  }
  return row.userId;
}

/**
 * Repli : `/api/auth/get-session` avec le plugin `bearer()` (conversion Bearer → cookie).
 * Utilisé par l’app Expo en multipart, qui envoie `Authorization: Bearer <session.token>`.
 */
async function resolveUserIdFromAuthGetSession(
  authHeaders: Headers,
): Promise<string | null> {
  const baseUrl = getBetterAuthServerBaseUrl();
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/auth/get-session`, {
      method: "GET",
      headers: {
        cookie: authHeaders.get("cookie") ?? "",
        authorization: authHeaders.get("authorization") ?? "",
        "expo-origin": authHeaders.get("expo-origin") ?? "",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { user?: { id?: string } } | null;
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function resolveUserIdFromApiRequest(
  request: NextRequest,
): Promise<string | null> {
  const authHeaders = await buildAuthHeaders(request);

  const fromSession = await resolveUserIdFromSessionHeaders(authHeaders);
  if (fromSession) return fromSession;

  const bearer = parseBearerToken(request.headers.get("authorization"));
  if (bearer) {
    const fromDb = await resolveUserIdFromBearerToken(bearer);
    if (fromDb) return fromDb;
  }

  return resolveUserIdFromAuthGetSession(authHeaders);
}

/**
 * Id utilisateur pour routes API **publiques** avec auth optionnelle (ex. `GET /api/game/home`).
 * Lit cookie de session et/ou `Authorization: Bearer <sessionToken>` (Better Auth / Expo).
 * Retourne `null` si absent, expiré ou invalide — sans 401.
 */
export async function getOptionalUserIdFromApiRequest(
  request: NextRequest,
): Promise<string | null> {
  return resolveUserIdFromApiRequest(request);
}

/**
 * Id utilisateur pour routes API **protégées** (jeu, avis, profil…).
 * Compatible multipart Expo : Bearer `session.token` sans en-tête Cookie.
 */
export async function getRequiredUserIdFromApiRequest(
  request: NextRequest,
): Promise<string | null> {
  return resolveUserIdFromApiRequest(request);
}
