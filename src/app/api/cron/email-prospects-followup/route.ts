import { NextRequest, NextResponse } from "next/server";
import { sendProspectFollowups } from "@/lib/prospects-followup";

/**
 * Relance automatique des prospects actifs dont la date de relance est atteinte.
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

  const { queued, skipped } = await sendProspectFollowups();
  return NextResponse.json({ ok: true, queued, skipped });
}
