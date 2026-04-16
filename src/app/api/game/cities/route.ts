import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicCatalogAdventureWhere } from "@/lib/adventure-public-access";

/**
 * Référentiel villes pour filtres mobile (autocomplete, sélection de zone).
 * Query params:
 * - q?: string (recherche sur nom)
 * - activeOnly?: "true" | "false" (default true => villes avec >=1 aventure active)
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const activeOnly = request.nextUrl.searchParams.get("activeOnly") !== "false";

  const cities = await prisma.city.findMany({
    where: {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(activeOnly
        ? { adventures: { some: publicCatalogAdventureWhere } }
        : {}),
    },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      inseeCode: true,
      postalCodes: true,
      latitude: true,
      longitude: true,
      population: true,
      adventures: {
        where: publicCatalogAdventureWhere,
        select: { id: true },
      },
    },
  });

  return NextResponse.json({
    cities: cities.map((c) => ({
      id: c.id,
      name: c.name,
      inseeCode: c.inseeCode,
      postalCodes: c.postalCodes,
      latitude: c.latitude,
      longitude: c.longitude,
      population: c.population,
      activeAdventureCount: c.adventures.length,
    })),
  });
}
