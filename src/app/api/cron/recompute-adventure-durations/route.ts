import { NextRequest, NextResponse } from "next/server";
import { recomputeAdventurePlayDurationStats } from "@/lib/game/recompute-adventure-play-duration-stats";

/**
 * Recalcule les durées moyennes de jeu par aventure (`Adventure.averagePlayDurationSeconds`, …).
 * Protégé par `Authorization: Bearer <CRON_SECRET>` (variable d’environnement).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré." },
      { status: 503 }
    );
  }
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await recomputeAdventurePlayDurationStats();
  return NextResponse.json({
    ok: true,
    stalePlaySessionsClosed: result.stalePlaySessionsClosed,
    adventuresUpdated: result.adventuresUpdated,
  });
}
