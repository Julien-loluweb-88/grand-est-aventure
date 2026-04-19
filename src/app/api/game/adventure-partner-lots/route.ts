import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserRoleForAccess,
  userCanAccessAdventureForPlay,
} from "@/lib/adventure-public-access";
import { getAdventurePartnerWheelState } from "@/lib/adventure-partner-lots/adventure-partner-lots";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;

/**
 * État roue partenaires en fin d’aventure : lots éligibles (aventure + ville), gain déjà tiré.
 * Query : `adventureId` (obligatoire). Session requise.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(
    `adventure-partner-lots:${ip}:${session.user.id}`,
    MAX_PER_WINDOW,
    WINDOW_MS
  );
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

  const userId = session.user.id;

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: {
      id: true,
      status: true,
      audience: true,
    },
  });

  if (!adventure || adventure.status === false) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const userRole = await getUserRoleForAccess(userId);
  const canPlay = await userCanAccessAdventureForPlay(prisma, {
    userId,
    role: userRole,
    adventure,
  });
  if (!canPlay) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const state = await getAdventurePartnerWheelState({ userId, adventureId });
  if (!state) {
    return NextResponse.json({ error: "Aventure introuvable." }, { status: 404 });
  }

  return NextResponse.json(state);
}
