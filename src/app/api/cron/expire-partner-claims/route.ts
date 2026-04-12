import { NextRequest, NextResponse } from "next/server";
import { expireStalePartnerOfferClaims } from "@/lib/partner-offers/partner-offer-claims";

/**
 * Passe en EXPIRED les demandes PENDING de plus de 24 h.
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

  const { count } = await expireStalePartnerOfferClaims();
  return NextResponse.json({ expired: count });
}
