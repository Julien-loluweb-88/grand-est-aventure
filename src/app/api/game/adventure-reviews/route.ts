import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserRoleForAccess,
  userCanAccessAdventureForPlay,
} from "@/lib/adventure-public-access";
import { isAdminRole } from "@/lib/admin-access";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import type { Prisma } from "../../../../../generated/prisma/client";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseIntParam(value: string | null, fallback: number): number {
  if (value == null || value.trim() === "") return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseBooleanQuery(value: string | null): boolean {
  if (value == null || value.trim() === "") return false;
  const t = value.trim().toLowerCase();
  return t === "true" || t === "1" || t === "yes";
}

function publicAuthorName(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const first = name.trim().split(/\s+/)[0];
  return first ?? null;
}

/**
 * Liste des avis **publics** : uniquement `moderationStatus === APPROVED`.
 * Query :
 * - mode "aventure" (public) : `adventureId` + `limit`, `offset`, `reportsOnly`
 * - mode "global" (public) : sans `adventureId` + `limit`, `offset`, `reportsOnly`
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

  const adventureIdRaw = (request.nextUrl.searchParams.get("adventureId") ?? "").trim();
  const hasAdventureId = Boolean(adventureIdRaw);

  const reportsOnly = parseBooleanQuery(request.nextUrl.searchParams.get("reportsOnly"));

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseIntParam(request.nextUrl.searchParams.get("limit"), DEFAULT_LIMIT))
  );
  const offset = Math.max(0, parseIntParam(request.nextUrl.searchParams.get("offset"), 0));

  const session = await auth.api.getSession({ headers: await headers() });
  const viewerId = session?.user?.id ?? null;
  const viewerRole = viewerId ? await getUserRoleForAccess(viewerId) : null;

  // Mode 1 : public, filtré par aventure.
  if (hasAdventureId) {
    const adventure = await prisma.adventure.findFirst({
      where: { id: adventureIdRaw, status: true },
      select: { id: true, name: true, audience: true },
    });
    if (!adventure) {
      return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
    }

    const canSee = await userCanAccessAdventureForPlay(prisma, {
      userId: viewerId ?? "__no_session__",
      role: viewerRole,
      adventure: { id: adventure.id, status: true, audience: adventure.audience },
    });
    if (!canSee) {
      return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
    }

    const reviewWhere: Prisma.AdventureReviewWhereInput = {
      adventureId: adventure.id,
      moderationStatus: "APPROVED",
      ...(reportsOnly
        ? { OR: [{ reportsMissingBadge: true }, { reportsStolenTreasure: true }] }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.adventureReview.count({ where: reviewWhere }),
      prisma.adventureReview.findMany({
        where: reviewWhere,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          rating: true,
          content: true,
          image: true,
          createdAt: true,
          reportsMissingBadge: true,
          reportsStolenTreasure: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      limit,
      offset,
      reportsOnly,
      reviews: rows.map((r) => ({
        id: r.id,
        adventureId: adventure.id,
        adventureName: adventure.name,
        rating: r.rating,
        content: r.content,
        imageUrl: r.image,
        createdAt: r.createdAt.toISOString(),
        reportsMissingBadge: r.reportsMissingBadge,
        reportsStolenTreasure: r.reportsStolenTreasure,
        authorDisplayName: publicAuthorName(r.user.name),
      })),
    });
  }

  // Mode 2 : global (toutes aventures).
  // Public : seulement APPROVED. Admin/superadmin : tous les statuts.
  const canSeeAllModerationStatuses = isAdminRole(viewerRole);
  const reviewWhere: Prisma.AdventureReviewWhereInput = {
    ...(!canSeeAllModerationStatuses ? { moderationStatus: "APPROVED" } : {}),
    ...(reportsOnly
      ? { OR: [{ reportsMissingBadge: true }, { reportsStolenTreasure: true }] }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.adventureReview.count({ where: reviewWhere }),
    prisma.adventureReview.findMany({
      where: reviewWhere,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        adventureId: true,
        rating: true,
        content: true,
        image: true,
        createdAt: true,
        reportsMissingBadge: true,
        reportsStolenTreasure: true,
        moderationStatus: true,
        adventure: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    limit,
    offset,
    reportsOnly,
    reviews: rows.map((r) => {
      const base = {
        id: r.id,
        adventureId: r.adventureId,
        adventureName: r.adventure.name,
        rating: r.rating,
        content: r.content,
        imageUrl: r.image,
        createdAt: r.createdAt.toISOString(),
        reportsMissingBadge: r.reportsMissingBadge,
        reportsStolenTreasure: r.reportsStolenTreasure,
        authorDisplayName: publicAuthorName(r.user.name),
      };
      return canSeeAllModerationStatuses
        ? { ...base, moderationStatus: r.moderationStatus }
        : base;
    }),
  });
}
