import "server-only";

import { getSession } from "@/lib/auth/auth-user";
import { isSuperadmin } from "@/lib/admin-access";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { prisma } from "@/lib/prisma";

export type MerchantActor = { id: string; role: "merchant" };

export async function getMerchantActorForAuthorization(): Promise<MerchantActor | null> {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "merchant") {
    return null;
  }
  return { id: session.user.id, role: "merchant" };
}

export async function assertSuperadminForAdvertisements(): Promise<
  { ok: true; actor: { id: string; role: string } } | { ok: false; error: string }
> {
  const actor = await getAdminActorForAuthorization();
  if (!actor || !isSuperadmin(actor.role)) {
    return { ok: false, error: "Réservé aux super administrateurs." };
  }
  return { ok: true, actor };
}

export async function merchantOwnsAdvertisement(
  merchantUserId: string,
  advertisementId: string
): Promise<boolean> {
  const row = await prisma.advertisement.findFirst({
    where: { id: advertisementId, ownerMerchantUserId: merchantUserId },
    select: { id: true },
  });
  return Boolean(row);
}

export async function countMerchantOwnedSlots(merchantUserId: string): Promise<number> {
  return prisma.advertisement.count({
    where: { ownerMerchantUserId: merchantUserId },
  });
}

export async function getMerchantAdvertisementQuota(
  merchantUserId: string
): Promise<{ max: number | null; used: number }> {
  const [user, used] = await Promise.all([
    prisma.user.findUnique({
      where: { id: merchantUserId },
      select: { merchantMaxAdvertisementSlots: true },
    }),
    countMerchantOwnedSlots(merchantUserId),
  ]);
  return {
    max: user?.merchantMaxAdvertisementSlots ?? null,
    used,
  };
}
