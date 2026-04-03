"use client"

import dynamic from "next/dynamic"
import type { AdventureWithMarkers, LocationPickerContextMarker  } from "../acceuil.action"
import { MapPin, Route } from "lucide-react";


const AdventureReadOnlyMap = dynamic(
  () => import("@/components/location/LocationPickerMap"),
  { ssr: false }
);

type AdventureMapProps = {
    adventures: AdventureWithMarkers[];
};

export default function AdventureMapClient({ adventures }: AdventureMapProps) {
  const mapNoop = () => {};
  if (typeof window === "undefined") return null;

  const departureMarkers: LocationPickerContextMarker[] = adventures.flatMap((adv) =>
  adv.mapContextMarkers.filter((m) => m.kind === "departure")
  );

  const initialLat = departureMarkers[0]?.latitude ?? 0;
  const initialLng = departureMarkers[0]?.longitude ?? 0;

  return (
    <div className="flex flex-col items-center text-center gap-3">
            
      <div className="w-150 h-100">
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
    </div>
    </div>
  );
}