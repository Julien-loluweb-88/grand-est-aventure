import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;

function publicAuthorName(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const first = name.trim().split(/\s+/)[0];
  return first ?? null;
}

type Ctx = { params: Promise<{ id: string }> };

/**
 * Détail d’un avis **public** (uniquement si `moderationStatus === APPROVED`).
 */
export async function GET(_request: NextRequest, context: Ctx) {
  const ip = getClientIp(_request);
  const rl = checkRateLimit(`adventure-review-get:${ip}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  const { id } = await context.params;
  const reviewId = id.trim();
  if (!reviewId) {
    return NextResponse.json({ error: "id requis." }, { status: 400 });
  }

  const row = await prisma.adventureReview.findFirst({
    where: { id: reviewId, moderationStatus: "APPROVED" },
    select: {
      id: true,
      rating: true,
      content: true,
      image: true,
      createdAt: true,
      adventureId: true,
      user: { select: { name: true } },
      adventure: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (!row || !row.adventure.status) {
    return NextResponse.json({ error: "Avis introuvable ou non publié." }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    adventureId: row.adventureId,
    adventureName: row.adventure.name,
    rating: row.rating,
    content: row.content,
    imageUrl: row.image,
    createdAt: row.createdAt.toISOString(),
    authorDisplayName: publicAuthorName(row.user.name),
  });
}
