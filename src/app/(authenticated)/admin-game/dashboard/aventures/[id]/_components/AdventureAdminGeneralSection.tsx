import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdventureEditFormClient } from "./AdventureEditFormClient";
import type { AdventureEditFormPayload } from "../_lib/adventure-edit-payload";

export function AdventureAdminGeneralSection({
  adventurePayload,
}: {
  adventurePayload: AdventureEditFormPayload;
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
        <AdventureEditFormClient adventure={adventurePayload} />
      </CardContent>
    </Card>
  );
}
