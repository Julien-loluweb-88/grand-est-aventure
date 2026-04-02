"use client"

import dynamic from "next/dynamic"
import type { AdventureWithMarkers } from "../acceuil.action"
import { MapPin, Route } from "lucide-react";


const AdventureReadOnlyMap = dynamic(
  () => import("@/components/location/LocationPickerMap"),
  { ssr: false }
);

type AdventureMapProps = {
    adventure: AdventureWithMarkers;
};

export default function AdventureMapClient({ adventure }: AdventureMapProps) {
  const mapNoop = () => {};
  if (typeof window === "undefined") return null;

  function formatCoord(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });
}

  return (
    <div className="flex flex-col items-center text-center gap-3">
              <p className="text-base font-medium uppercase tracking-wide text-muted-foreground/90">
                Distance parcours
              </p>
              <div className="flex flex-row gap-3">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <Route className="size-3.5 shrink-0 opacity-70" aria-hidden />
                {adventure.distance != null
                  ? `${adventure.distance.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} km`
                  : "Non calculée"}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        <span className="font-mono tabular-nums">
          {formatCoord(adventure.latitude)}°, {formatCoord(adventure.longitude)}°
        </span>
        <span className="text-muted-foreground/80">(départ)</span>
      </p>
      </div>
            
      <div className="w-[600px] h-[400px]">
      <AdventureReadOnlyMap
        readOnly
        latitude={adventure.latitude}
        longitude={adventure.longitude}
        onChange={mapNoop}
        contextMarkers={adventure.mapContextMarkers}
        routePolyline={adventure.routePolyline}
        editableMarkerKind="departure"
        mapClassName="min-h-[220px] sm:h-72"
      />
    </div>
    </div>
  );
}