import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listCitiesForAdventureSelect } from "@/lib/city-admin-queries";
import { listMerchantUsersForAdvertisementForm } from "../_lib/advertisement-admin-queries";
import { AdvertisementForm } from "../_components/AdvertisementForm";

export default async function CreatePublicitePage() {
  const [cities, merchants] = await Promise.all([
    listCitiesForAdventureSelect(),
    listMerchantUsersForAdvertisementForm(),
  ]);

  return (
    <div className="m-8 space-y-6">
      <Link
        href="/admin-game/dashboard/publicites"
        className="inline-flex text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Publicités
      </Link>
      <Card className="h-fit p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold tracking-tight">Nouvelle publicité</CardTitle>
          <CardDescription>
            Définissez le placement (code côté appli), le ciblage par villes ou zone, puis utilisez l’API
            publique pour l’affichage et les événements.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <AdvertisementForm
            mode="create"
            cities={cities}
            merchantOptions={merchants ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
