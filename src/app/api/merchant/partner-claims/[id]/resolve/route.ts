import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resolvePartnerOfferClaim } from "@/lib/partner-offers/partner-offer-claims";

type RouteParams = { params: Promise<{ id: string }> };

/** Approuve ou refuse une demande (commerçant autorisé sur la publicité) — typiquement depuis l’app mobile. */
export async function POST(request: NextRequest, ctx: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (session.user.role !== "merchant") {
    return NextResponse.json({ error: "Réservé aux comptes commerçant." }, { status: 403 });
  }

  const { id: claimId } = await ctx.params;
  if (!claimId?.trim()) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  let body: { action?: string; rejectionReason?: string | null };
  try {
    body = (await request.json()) as { action?: string; rejectionReason?: string | null };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  const action = (body.action ?? "").trim().toLowerCase();
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action doit valoir « approve » ou « reject »." },
      { status: 400 }
    );
  }

  const result = await resolvePartnerOfferClaim({
    claimId,
    merchantUserId: session.user.id,
    action,
    rejectionReason: body.rejectionReason,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    status: result.status,
    awardedUserBadge: result.awardedUserBadge,
  });
}
