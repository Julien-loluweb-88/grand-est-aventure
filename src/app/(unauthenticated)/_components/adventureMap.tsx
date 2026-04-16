"use client";

import { useEffect, useMemo, useState } from "react";
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

function HomeMapEmpty() {
  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#281401]/10 bg-linear-to-br from-[#fef0c7]/90 via-white to-[#e8f5e0]/40 p-8 text-center shadow-sm ring-1 ring-[#68a618]/10 sm:p-10">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div
          className="flex size-16 items-center justify-center rounded-2xl bg-[#68a618]/15 text-3xl shadow-inner"
          aria-hidden
        >
          🗺️
        </div>
        <h3 className="text-balance text-lg font-semibold tracking-tight text-[#281401] sm:text-xl">
          Encore un peu de patience…
        </h3>
        <p className="text-pretty text-sm leading-relaxed text-[#281401]/75 sm:text-base">
          Les parcours se rajoutent au fil des semaines près de chez vous. En attendant, installez
          l&apos;app Android : le jour où la carte s&apos;anime, vous n&apos;aurez plus qu&apos;à
          choisir votre prochaine sortie en famille&nbsp;!
        </p>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#68a618]">
          À très bientôt sur les chemins
        </p>
      </div>
    </div>
  );
}

export default function AdventureMapClient({ adventures }: AdventureMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const departureMarkers: LocationPickerContextMarker[] = useMemo(
    () =>
      adventures.flatMap((adv) =>
        adv.mapContextMarkers.filter((m) => m.kind === "departure")
      ),
    [adventures]
  );

  const initialLat = departureMarkers[0]?.latitude ?? 48.5734;
  const initialLng = departureMarkers[0]?.longitude ?? 6.7484;

  const mapNoop = () => {};

  if (adventures.length === 0) {
    return <HomeMapEmpty />;
  }

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
            omitPrimaryMarker
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
      <p className="max-w-lg text-xs leading-relaxed text-[#281401]/55 sm:text-sm">
        Chaque <strong className="font-medium text-[#281401]/70">pastille</strong>, c&apos;est un
        départ. Survolez-la pour voir le nom du parcours, la distance et les avis des autres
        joueurs ; cliquez pour lire tout en détail avant de vous lancer&nbsp;!
      </p>
    </div>
  );
}
