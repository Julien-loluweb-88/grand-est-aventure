import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserRoleForAccess,
  userCanAccessAdventureForPlay,
} from "@/lib/adventure-public-access";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseIntParam(value: string | null, fallback: number): number {
  if (value == null || value.trim() === "") return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function publicAuthorName(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const first = name.trim().split(/\s+/)[0];
  return first ?? null;
}

/**
 * Liste des avis **publics** : uniquement `moderationStatus === APPROVED`.
 * Query : `adventureId` (obligatoire), `limit`, `offset`.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`adventure-reviews-list:${ip}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  const adventureId = (request.nextUrl.searchParams.get("adventureId") ?? "").trim();
  if (!adventureId) {
    return NextResponse.json({ error: "Paramètre adventureId requis." }, { status: 400 });
  }

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseIntParam(request.nextUrl.searchParams.get("limit"), DEFAULT_LIMIT))
  );
  const offset = Math.max(0, parseIntParam(request.nextUrl.searchParams.get("offset"), 0));

  const adventure = await prisma.adventure.findFirst({
    where: { id: adventureId, status: true },
    select: { id: true, audience: true },
  });
  if (!adventure) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const viewerId = session?.user?.id;
  const viewerRole = viewerId ? await getUserRoleForAccess(viewerId) : null;
  const canSee = await userCanAccessAdventureForPlay(prisma, {
    userId: viewerId ?? "__no_session__",
    role: viewerRole,
    adventure: { id: adventure.id, status: true, audience: adventure.audience },
  });
  if (!canSee) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const [total, rows] = await Promise.all([
    prisma.adventureReview.count({
      where: { adventureId, moderationStatus: "APPROVED" },
    }),
    prisma.adventureReview.findMany({
      where: { adventureId, moderationStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        rating: true,
        content: true,
        image: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    limit,
    offset,
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      imageUrl: r.image,
      createdAt: r.createdAt.toISOString(),
      authorDisplayName: publicAuthorName(r.user.name),
    })),
  });
}
