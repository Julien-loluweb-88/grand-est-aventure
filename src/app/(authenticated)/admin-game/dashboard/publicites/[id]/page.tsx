import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listCitiesForAdventureSelect } from "@/lib/city-admin-queries";
import {
  getAdvertisementForAdminEdit,
  listMerchantUsersForAdvertisementForm,
} from "../_lib/advertisement-admin-queries";
import { toDatetimeLocalValue } from "../_lib/datetime-local";
import { AdvertisementForm } from "../_components/AdvertisementForm";

export default async function EditPublicitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, cities, merchants] = await Promise.all([
    getAdvertisementForAdminEdit(id),
    listCitiesForAdventureSelect(),
    listMerchantUsersForAdvertisementForm(),
  ]);

  if (!result.ok) {
    if (result.reason === "auth") {
      redirect("/admin-game/dashboard/acces-refuse");
    }
    notFound();
  }
  const ad = result.data;

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
          <CardTitle className="text-2xl font-bold tracking-tight">Modifier : {ad.name}</CardTitle>
          <CardDescription className="font-mono text-xs">id {ad.id}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <AdvertisementForm
            mode="edit"
            advertisementId={ad.id}
            cities={cities}
            merchantOptions={merchants ?? []}
            defaultValues={{
              name: ad.name,
              advertiserKind: ad.advertiserKind,
              advertiserName: ad.advertiserName,
              title: ad.title ?? "",
              body: ad.body ?? "",
              imageUrl: ad.imageUrl ?? "",
              targetUrl: ad.targetUrl ?? "",
              placement: ad.placement,
              active: ad.active,
              startsAt: toDatetimeLocalValue(ad.startsAt),
              endsAt: toDatetimeLocalValue(ad.endsAt),
              sortOrder: ad.sortOrder,
              targetCenterLatitude:
                ad.targetCenterLatitude != null ? String(ad.targetCenterLatitude) : "",
              targetCenterLongitude:
                ad.targetCenterLongitude != null ? String(ad.targetCenterLongitude) : "",
              targetRadiusMeters:
                ad.targetRadiusMeters != null ? String(ad.targetRadiusMeters) : "",
              targetCityIds: ad.targetCities.map((c) => c.id),
              partnerBadgeTitle: ad.partnerBadgeDefinition?.title ?? "",
              partnerBadgeImageUrl: ad.partnerBadgeDefinition?.imageUrl ?? "",
              partnerMaxRedemptionsPerUser: ad.partnerMaxRedemptionsPerUser,
              partnerClaimsOpen: ad.partnerClaimsOpen,
              merchantUserIds: ad.merchantAssignments.map((m) => m.userId),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
