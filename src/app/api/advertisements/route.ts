import { NextRequest, NextResponse } from "next/server";
import { listEligibleAdvertisements } from "@/lib/advertisements/list-eligible-advertisements";
import { getOptionalUserIdFromApiRequest } from "@/lib/auth/get-optional-api-session-user-id";

/**
 * Liste les publicités éligibles pour l’appli joueur.
 * Query : `placement` (obligatoire), `cityId`, `latitude`, `longitude`.
 * Sans `cityId` mais avec GPS : la ville est **inférée** (API Gouv INSEE + repli catalogue).
 * Si session / Bearer valide, les encarts masqués sont exclus.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const placement = (searchParams.get("placement") ?? "").trim();
  if (!placement) {
    return NextResponse.json(
      { error: "Paramètre placement requis." },
      { status: 400 }
    );
  }

  const cityId = (searchParams.get("cityId") ?? "").trim() || undefined;
  const latRaw = searchParams.get("latitude");
  const lonRaw = searchParams.get("longitude");
  let latitude: number | undefined;
  let longitude: number | undefined;
  if (latRaw != null && latRaw !== "") {
    latitude = Number(latRaw);
    if (!Number.isFinite(latitude)) {
      return NextResponse.json({ error: "latitude invalide." }, { status: 400 });
    }
  }
  if (lonRaw != null && lonRaw !== "") {
    longitude = Number(lonRaw);
    if (!Number.isFinite(longitude)) {
      return NextResponse.json({ error: "longitude invalide." }, { status: 400 });
    }
  }

  const userId = await getOptionalUserIdFromApiRequest(request);

  const { advertisements } = await listEligibleAdvertisements({
    placement,
    cityId,
    latitude,
    longitude,
    userId,
    inferCityFromCoordinates: true,
  });

  return NextResponse.json({ advertisements });
}
