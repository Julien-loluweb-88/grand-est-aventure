import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  const body = await request.json();
  const { adventureId, userId, rating, content, consentCommunicationNetworks} = body as {
    adventureId?: string;
    userId?: string;
    rating?: number;
    content?: string;
    consentCommunicationNetworks?: boolean;
  };

  if (!adventureId || !userId || typeof content !== "string") {
    return NextResponse.json(
      { error: "Paramètres invalides (adventureId, userId, success requis)." },
      { status: 400 }
    );
  }

  if (!session?.user?.id || session.user.id !== userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await prisma.$transaction((tx) =>
      processAdventureReview(tx, {
        adventureId,
        userId,
        rating,
        content,
        consentCommunicationNetworks
      })
    );


  return NextResponse.json({
    message: "Aventure terminée avec succès",
    awardedUserBadgeIds: "result.awardedUserBadgeIds",
  });
}
