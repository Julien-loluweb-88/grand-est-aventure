import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import {
  processAdventureReview,
  ReviewValidationError,
} from "@/lib/game/process-adventure-review";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function parseBoolean(v: unknown): boolean {
  return v === true;
}

/**
 * Enregistre ou met à jour l’avis / signalement de fin de parcours (1 ligne par user × aventure).
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`review:${ip}:${session.user.id}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const adventureId = typeof b.adventureId === "string" ? b.adventureId.trim() : "";
  const userId = typeof b.userId === "string" ? b.userId.trim() : "";

  if (!adventureId || !userId) {
    return NextResponse.json(
      { error: "adventureId et userId sont requis." },
      { status: 400 }
    );
  }

  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (typeof b.content !== "string" && b.content != null) {
    return NextResponse.json({ error: "content doit être une chaîne." }, { status: 400 });
  }
  const content = typeof b.content === "string" ? b.content : "";

  try {
    const result = await prisma.$transaction((tx) =>
      processAdventureReview(tx, {
        adventureId,
        userId,
        rating: b.rating,
        content,
        consentCommunicationNetworks: parseBoolean(b.consentCommunicationNetworks),
        reportsMissingBadge: parseBoolean(b.reportsMissingBadge),
        reportsStolenTreasure: parseBoolean(b.reportsStolenTreasure),
      })
    );

    return NextResponse.json({
      ok: true,
      id: result.id,
      message: "Avis enregistré.",
    });
  } catch (e) {
    if (e instanceof ReviewValidationError) {
      const map: Record<ReviewValidationError["code"], { status: number; msg: string }> = {
        INVALID_RATING: { status: 400, msg: "La note doit être un entier entre 1 et 5." },
        CONTENT_TOO_LONG: {
          status: 400,
          msg: "Le commentaire dépasse 10000 caractères.",
        },
        ADVENTURE_NOT_FOUND: { status: 404, msg: "Aventure introuvable." },
        EMPTY_REVIEW: {
          status: 400,
          msg: "Renseignez au moins une note, un commentaire, une option de signalement ou le consentement.",
        },
      };
      const { status, msg } = map[e.code];
      return NextResponse.json({ error: msg }, { status });
    }
    throw e;
  }
}
