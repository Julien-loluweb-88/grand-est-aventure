import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateEnigmaForm } from "./EnigmaCreateForm";
import { ListEnigmaTable } from "./ListeEnigma";
import { EnigmaOrderEditor } from "./EnigmaOrderEditor";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";
import type { EnigmaListItem } from "../_lib/enigma-queries";
import type { EnigmaOrderRow } from "../_lib/enigma-order-types";

export function AdventureAdminEnigmasSection({
  adventureId,
  nextEnigmaNumber,
  mapReferenceMarkers,
  routePolyline,
  enigmas,
  total,
  page,
  search,
  loadError,
  enigmaOrderRows,
  enigmaOrderInitial,
}: {
  adventureId: string;
  nextEnigmaNumber: number;
  mapReferenceMarkers: LocationPickerContextMarker[];
  routePolyline: [number, number][] | null;
  enigmas: EnigmaListItem[];
  total: number;
  page: number;
  search: string;
  loadError: string | null;
  enigmaOrderRows: EnigmaOrderRow[];
  enigmaOrderInitial: EnigmaOrderRow[];
}) {
  return (
    <Card className="relative">
      <div className="absolute inset-e-4 top-4 z-10">
        <CreateEnigmaForm
          nextEnigmaNumber={nextEnigmaNumber}
          mapReferenceMarkers={mapReferenceMarkers}
          routePolyline={routePolyline}
        />
      </div>
      <CardHeader className="flex flex-col items-center text-center pe-24 sm:pe-4">
        <CardTitle>Énigmes</CardTitle>
        <CardDescription>Liste des énigmes de cette aventure</CardDescription>
      </CardHeader>
      <CardContent>
        <ListEnigmaTable
          adventureId={adventureId}
          enigmas={enigmas}
          total={total}
          page={page}
          search={search}
          loadError={loadError}
          mapReferenceMarkers={mapReferenceMarkers}
          routePolyline={routePolyline}
        />
        {enigmaOrderRows.length > 0 ? (
          <EnigmaOrderEditor adventureId={adventureId} initialRows={enigmaOrderInitial} />
        ) : null}
      </CardContent>
    </Card>
  );
}
