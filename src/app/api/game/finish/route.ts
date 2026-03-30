import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processGameFinish } from "@/lib/badges/award-on-finish";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const body = await request.json();
  const { adventureId, userId, success, giftNumber } = body as {
    adventureId?: string;
    userId?: string;
    success?: boolean;
    giftNumber?: number;
  };

  if (!adventureId || !userId || typeof success !== "boolean") {
    return NextResponse.json(
      { error: "Paramètres invalides (adventureId, userId, success requis)." },
      { status: 400 }
    );
  }

  if (!session?.user?.id || session.user.id !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await prisma.$transaction((tx) =>
    processGameFinish(tx, {
      adventureId,
      userId,
      success,
      clientGiftNumber:
        typeof giftNumber === "number" && !Number.isNaN(giftNumber)
          ? giftNumber
          : undefined,
    })
  );

  return NextResponse.json({
    message: "Aventure terminée avec succès",
    awardedUserBadgeIds: result.awardedUserBadgeIds,
  });
}
