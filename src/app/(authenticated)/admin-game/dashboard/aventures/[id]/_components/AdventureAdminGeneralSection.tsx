import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdventureEditFormClient } from "./AdventureEditFormClient";
import type { AdventureEditFormPayload } from "../_lib/adventure-edit-payload";
import type { CitySelectOption } from "@/lib/city-types";

export function AdventureAdminGeneralSection({
  adventurePayload,
  cities,
}: {
  adventurePayload: AdventureEditFormPayload;
  cities: CitySelectOption[];
}) {
  return (
    <Card className="h-fit overflow-visible">
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        <CardDescription>
          Aperçu en lecture seule ; utilisez « Modifier » pour éditer nom, ville, description et point
          de départ (distance recalculée via OpenRouteService après enregistrement).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdventureEditFormClient adventure={adventurePayload} cities={cities} />
      </CardContent>
    </Card>
  );
}
