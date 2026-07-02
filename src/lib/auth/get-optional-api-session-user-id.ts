import "server-only";

import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
 * Id utilisateur pour routes API **publiques** avec auth optionnelle (ex. `GET /api/game/home`).
 * Lit cookie de session et/ou `Authorization: Bearer <sessionToken>` (Better Auth / Expo).
 * Retourne `null` si absent, expiré ou invalide — sans 401.
 */
export async function getOptionalUserIdFromApiRequest(
  request: NextRequest
): Promise<string | null> {
  const authHeaders = await buildAuthHeaders(request);

  try {
    const session = await auth.api.getSession({ headers: authHeaders });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Token / cookie invalide → traiter comme anonyme
  }

  const bearer = parseBearerToken(request.headers.get("authorization"));
  if (!bearer) {
    return null;
  }

  return resolveUserIdFromBearerToken(bearer);
}
