import { NextRequest, NextResponse } from "next/server";
import { sendProspectFollowups } from "@/lib/prospects-followup";

/**
 * Relance automatique des prospects actifs dont la date de relance est atteinte.
 * 3 files (intro / relance J+10 / dernier message), 10 mails/heure, 8h–19h (Europe/Paris).
 * Protégé par `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  }
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await sendProspectFollowups();
  return NextResponse.json({
    ok: true,
    sent: result.queued,
    skipped: result.skipped,
    queue: result.queue ?? null,
    backlog: result.backlog ?? 0,
    dispatchedBatch: result.dispatchedBatch ?? 0,
    outsideWindow: result.outsideWindow ?? false,
    alreadyRunning: result.alreadyRunning ?? false,
  });
}
