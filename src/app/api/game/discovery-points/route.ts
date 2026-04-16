import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRoleForAccess } from "@/lib/adventure-public-access";
import { listDiscoveryPointsPublicByCityId } from "@/lib/game/discovery-points-public-query";

/**
 * Points de découverte pour carte mobile (ville entière : tous les POI géolocalisés dans la ville).
 * Query : `cityId` (obligatoire).
 */
export async function GET(request: NextRequest) {
  const cityId = (request.nextUrl.searchParams.get("cityId") ?? "").trim();
  if (!cityId) {
    return NextResponse.json({ error: "cityId requis." }, { status: 400 });
  }

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    select: { id: true },
  });
  if (!city) {
    return NextResponse.json({ error: "Ville introuvable." }, { status: 404 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const viewerId = session?.user?.id;
  const viewerRole = viewerId ? await getUserRoleForAccess(viewerId) : null;

  const points = await listDiscoveryPointsPublicByCityId(
    cityId,
    viewerId ? { userId: viewerId, role: viewerRole } : null
  );

  return NextResponse.json({ points });
}
