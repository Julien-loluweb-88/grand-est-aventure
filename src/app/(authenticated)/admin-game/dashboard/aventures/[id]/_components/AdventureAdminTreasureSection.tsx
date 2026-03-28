import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTreasureForm } from "./TreasureCreateForm";
import { TreasureCard } from "./TreasureCard";
import type { TreasureEditPayload } from "../_lib/treasure-edit-payload";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";

export function AdventureAdminTreasureSection({
  adventureId,
  hasTreasure,
  treasurePayload,
  mapReferenceMarkers,
  routePolyline,
}: {
  adventureId: string;
  hasTreasure: boolean;
  treasurePayload: TreasureEditPayload | null;
  mapReferenceMarkers: LocationPickerContextMarker[];
  routePolyline: [number, number][] | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trésor</CardTitle>
        <CardDescription>
          Dernière étape du parcours : position du coffre, texte présenté aux joueurs et codes (accès
          et coffre).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CreateTreasureForm
          hasTreasure={hasTreasure}
          mapReferenceMarkers={mapReferenceMarkers}
          routePolyline={routePolyline}
        />
        {treasurePayload ? (
          <TreasureCard
            adventureId={adventureId}
            treasure={treasurePayload}
            mapReferenceMarkers={mapReferenceMarkers}
            routePolyline={routePolyline}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
