import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liste des avatars actifs pour l’app (paramètres / carte / AR).
 * Pas d’auth : métadonnées publiques ; les fichiers 3D sont dans le bundle mobile (`slug`).
 */
export async function GET() {
  const avatars = await prisma.avatar.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      thumbnailUrl: true,
      modelUrl: true,
      sortOrder: true,
    },
  });

  return NextResponse.json({ avatars });
}
