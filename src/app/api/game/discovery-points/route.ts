import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const points = await listDiscoveryPointsPublicByCityId(cityId);

  return NextResponse.json({ points });
}
