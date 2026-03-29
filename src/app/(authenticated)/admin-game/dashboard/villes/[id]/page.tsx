import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCityByIdForAdmin } from "../_lib/city-queries";
import { CityForm } from "../_components/CityForm";

export default async function EditVillePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const city = await getCityByIdForAdmin(id);
  if (!city) notFound();

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
          <CardTitle className="text-2xl font-bold tracking-tight">Modifier : {city.name}</CardTitle>
          <CardDescription className="font-mono text-xs">id {city.id}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <CityForm
            mode="edit"
            cityId={city.id}
            defaultValues={{
              name: city.name,
              inseeCode: city.inseeCode ?? "",
              postalCodesRaw: city.postalCodes.join(", "),
              latitude: city.latitude != null ? String(city.latitude) : "",
              longitude: city.longitude != null ? String(city.longitude) : "",
              population: city.population != null ? String(city.population) : "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
