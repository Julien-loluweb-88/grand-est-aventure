import { NextRequest, NextResponse } from "next/server";
import { awardMonthlyKmChampions } from "@/lib/badges/jobs/award-monthly-km-champions";

/**
 * Attribue le badge « marcheur du mois » pour le mois civil précédent (fuseau Europe/Paris).
 * Protégé par `Authorization: Bearer <CRON_SECRET>`.
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

  const result = await awardMonthlyKmChampions();
  return NextResponse.json({ ok: true, ...result });
}
