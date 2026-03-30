import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Collection de badges du joueur connecté (virtuels + paliers). */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const rows = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    orderBy: { earnedAt: "desc" },
    include: {
      badgeDefinition: {
        select: {
          id: true,
          slug: true,
          title: true,
          imageUrl: true,
          kind: true,
          adventureId: true,
          criteria: true,
          sortOrder: true,
        },
      },
    },
  });

  return NextResponse.json({ badges: rows });
}
