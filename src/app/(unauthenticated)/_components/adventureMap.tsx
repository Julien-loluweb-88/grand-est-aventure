"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  appIsLive?: boolean;
};

function HomeMapEmpty({ appIsLive }: { appIsLive: boolean }) {
  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#281401]/10 bg-linear-to-br from-[#fef0c7]/80 via-white to-[#e8f5e0]/50 p-8 text-center shadow-sm ring-1 ring-[#68a618]/10 sm:p-12">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#68a618]/15 text-[#39951a] shadow-inner">
          <MapPin className="size-8" aria-hidden />
        </div>
        <h3 className="text-balance text-xl font-semibold tracking-tight text-[#281401]">
          Les premiers parcours arrivent
        </h3>
        <p className="text-pretty text-sm leading-relaxed text-[#281401]/75 sm:text-base">
          La carte se remplit au fil des semaines, commune par commune. Dès que l&apos;application
          sera en ligne, vous pourrez choisir un départ et partir en famille.
        </p>
        {!appIsLive ? (
          <Button
            variant="outline"
            className="rounded-xl border-[#68a618]/40 text-[#281401] hover:bg-[#e8f5e0]"
            asChild
          >
            <Link href="/contact">
              <MessageCircle className="mr-2 size-4" aria-hidden />
              Me prévenir de la sortie
            </Link>
          </Button>
        ) : null}
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#68a618]">
          À très bientôt sur les chemins
        </p>
      </div>
    </div>
  );
}

export default function AdventureMapClient({
  adventures,
  appIsLive = false,
}: AdventureMapProps) {
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
    return <HomeMapEmpty appIsLive={appIsLive} />;
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-4 text-center">
      <div className="w-full overflow-hidden rounded-2xl border border-[#281401]/10 bg-white/50 shadow-md ring-1 ring-[#68a618]/10">
        {!mounted ? (
          <div
            className="min-h-[240px] w-full animate-pulse rounded-md bg-linear-to-br from-[#e8f5e0]/80 to-[#fef0c7]/60 sm:h-80"
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
            mapClassName="min-h-[240px] sm:h-80"
          />
        )}
      </div>
      <p className="max-w-lg text-xs leading-relaxed text-[#281401]/60 sm:text-sm">
        {appIsLive ? (
          <>
            Chaque <strong className="font-medium text-[#281401]/75">pastille</strong> est un
            départ — survolez pour le détail, puis lancez l&apos;aventure dans l&apos;app sur
            place.
          </>
        ) : (
          <>
            Aperçu des parcours <strong className="font-medium text-[#281401]/75">en préparation</strong>{" "}
            — l&apos;app mobile permettra de les jouer dès sa sortie.
          </>
        )}
      </p>
    </div>
  );
}
