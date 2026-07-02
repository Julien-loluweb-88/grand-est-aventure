import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  listPartnerClaimsForMerchant,
  parseMerchantPartnerClaimStatus,
} from "@/lib/merchant/list-partner-claims-for-merchant";

/**
 * Liste des demandes d’offres pour les publicités gérées par le commerçant connecté.
 * Query : `status` (optionnel, défaut `PENDING`).
 * Client : app mobile ou site web (même session).
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (session.user.role !== "merchant") {
    return NextResponse.json({ error: "Réservé aux comptes commerçant." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = parseMerchantPartnerClaimStatus(searchParams.get("status"));

  const claims = await listPartnerClaimsForMerchant(session.user.id, status);

  return NextResponse.json({ claims });
}
