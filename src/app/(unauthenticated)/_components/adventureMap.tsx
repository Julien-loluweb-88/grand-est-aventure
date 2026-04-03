"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type {
  AdventureWithMarkers,
  LocationPickerContextMarker,
} from "../acceuil.action";

const AdventureReadOnlyMap = dynamic(
  () => import("@/components/location/LocationPickerMap"),
  { ssr: false }
);

type AdventureMapProps = {
  adventures: AdventureWithMarkers[];
};

export default function AdventureMapClient({ adventures }: AdventureMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const departureMarkers: LocationPickerContextMarker[] = adventures.flatMap(
    (adv) => adv.mapContextMarkers.filter((m) => m.kind === "departure")
  );

  const initialLat = departureMarkers[0]?.latitude ?? 0;
  const initialLng = departureMarkers[0]?.longitude ?? 0;

  const mapNoop = () => {};

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-4 text-center">
      <div className="w-full overflow-hidden rounded-xl border border-[#281401]/10 bg-white/40 shadow-sm ring-1 ring-[#281401]/5">
        {!mounted ? (
          <div
            className="min-h-[220px] w-full animate-pulse rounded-md bg-[#281401]/8 sm:h-72"
            aria-hidden
          />
        ) : (
          <AdventureReadOnlyMap
            readOnly
            latitude={initialLat}
            longitude={initialLng}
            onChange={mapNoop}
            contextMarkers={departureMarkers}
            routePolyline={[]}
            editableMarkerKind="departure"
            mapClassName="min-h-[220px] sm:h-72"
          />
        )}
      </div>
    </div>
  );
}