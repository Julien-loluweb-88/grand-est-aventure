import { NextResponse } from "next/server";
import { getPermissionSubjectUserId } from "@/lib/auth/permission-subject";
import { prisma } from "@/lib/prisma";

/**
 * Rôle de l’acteur « permission subject » (admin réel si impersonation) pour le proxy dashboard.
 * Ne remplace pas les contrôles fins côté serveur.
 */
export async function GET() {
  const id = await getPermissionSubjectUserId();
  if (!id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const u = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!u?.role) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ role: u.role });
}
