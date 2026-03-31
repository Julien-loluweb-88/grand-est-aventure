import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseNumber(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 6371 * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

/**
 * Liste "safe" des aventures pour app mobile.
 * Query params:
 * - cityId?: string
 * - q?: string (recherche sur nom)
 * - latitude?: number
 * - longitude?: number
 * - radiusKm?: number (nécessite latitude+longitude)
 * - limit?: number (default 20, max 100)
 * - offset?: number (default 0)
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;

  const cityId = (p.get("cityId") ?? "").trim() || undefined;
  const q = (p.get("q") ?? "").trim();
  const latitude = parseNumber(p.get("latitude"));
  const longitude = parseNumber(p.get("longitude"));
  const radiusKm = parseNumber(p.get("radiusKm"));

  const limitRaw = parseNumber(p.get("limit"));
  const offsetRaw = parseNumber(p.get("offset"));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isInteger(limitRaw) ? (limitRaw as number) : DEFAULT_LIMIT)
  );
  const offset = Math.max(0, Number.isInteger(offsetRaw) ? (offsetRaw as number) : 0);

  if ((latitude == null) !== (longitude == null)) {
    return NextResponse.json(
      { error: "latitude et longitude doivent être fournies ensemble." },
      { status: 400 }
    );
  }
  if (radiusKm != null && (latitude == null || longitude == null)) {
    return NextResponse.json(
      { error: "radiusKm nécessite latitude et longitude." },
      { status: 400 }
    );
  }
  if (radiusKm != null && radiusKm <= 0) {
    return NextResponse.json({ error: "radiusKm doit être > 0." }, { status: 400 });
  }

  const adventures = await prisma.adventure.findMany({
    where: {
      status: true,
      ...(cityId ? { cityId } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      cityId: true,
      latitude: true,
      longitude: true,
      distance: true,
      coverImageUrl: true,
      updatedAt: true,
      city: {
        select: {
          id: true,
          name: true,
          postalCodes: true,
        },
      },
      enigmas: { select: { id: true } },
      treasure: { select: { id: true } },
    },
  });

  const filtered = adventures
    .map((a) => {
      const distanceFromUserKm =
        latitude != null && longitude != null
          ? haversineKm(latitude, longitude, a.latitude, a.longitude)
          : null;
      return { ...a, distanceFromUserKm };
    })
    .filter((a) => (radiusKm == null ? true : (a.distanceFromUserKm ?? Infinity) <= radiusKm));

  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    total: filtered.length,
    limit,
    offset,
    adventures: paginated.map((a) => ({
      id: a.id,
      name: a.name,
      coverImageUrl: a.coverImageUrl,
      city: a.city,
      latitude: a.latitude,
      longitude: a.longitude,
      distanceKm: a.distance,
      distanceFromUserKm: a.distanceFromUserKm,
      enigmaCount: a.enigmas.length,
      hasTreasure: Boolean(a.treasure),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
}
