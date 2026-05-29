"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { PartnerOfferClaimStatus } from "@/lib/badges/prisma-enums";
import {
  listPartnerClaimsForMerchant,
  parseMerchantPartnerClaimStatus,
  type MerchantPartnerClaimListItem,
} from "@/lib/merchant/list-partner-claims-for-merchant";
import { resolvePartnerOfferClaim } from "@/lib/partner-offers/partner-offer-claims";

async function requireMerchantUserId(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { ok: false, error: "Non autorisé." };
  }
  if (session.user.role !== "merchant") {
    return { ok: false, error: "Réservé aux comptes commerçant." };
  }
  return { ok: true, userId: session.user.id };
}

export async function fetchMerchantPartnerClaims(
  statusRaw: string
): Promise<
  { ok: true; claims: MerchantPartnerClaimListItem[] } | { ok: false; error: string }
> {
  const authz = await requireMerchantUserId();
  if (!authz.ok) {
    return authz;
  }
  const status = parseMerchantPartnerClaimStatus(statusRaw);
  const claims = await listPartnerClaimsForMerchant(authz.userId, status);
  return { ok: true, claims };
}

export async function resolveMerchantPartnerClaimAction(input: {
  claimId: string;
  action: "approve" | "reject";
  rejectionReason?: string | null;
}): Promise<
  | { ok: true; status: PartnerOfferClaimStatus; awardedUserBadge: boolean }
  | { ok: false; error: string }
> {
  const authz = await requireMerchantUserId();
  if (!authz.ok) {
    return authz;
  }

  const claimId = input.claimId.trim();
  if (!claimId) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const result = await resolvePartnerOfferClaim({
    claimId,
    merchantUserId: authz.userId,
    action: input.action,
    rejectionReason: input.rejectionReason,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin-game/dashboard/commercant");
  revalidatePath("/admin-game/dashboard");

  return {
    ok: true,
    status: result.status,
    awardedUserBadge: result.awardedUserBadge,
  };
}
