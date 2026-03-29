import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CityForm } from "../_components/CityForm";

export default function CreateVillePage() {
  return (
    <div className="m-8 space-y-6">
      <Link
        href="/admin-game/dashboard/villes"
        className="inline-flex text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Villes
      </Link>
      <Card className="h-fit p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold tracking-tight">Nouvelle ville</CardTitle>
          <CardDescription>
            Les champs géographiques sont optionnels (utiles pour affichages ou exports).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <CityForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
