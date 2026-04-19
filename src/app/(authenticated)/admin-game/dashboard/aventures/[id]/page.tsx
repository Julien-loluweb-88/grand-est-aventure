import Link from "next/link";
import { getAdventureById } from "./_lib/adventure-queries";
import { getAdventureAdminScopeEditorData } from "./_lib/adventure-admin-scope-queries";
import { getUser } from "@/lib/auth/auth-user";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listEnigmaForAdmin, listEnigmaOrderForAdmin } from "./_lib/enigma-queries";
import { getAdventureRoutePolylineForMap } from "@/lib/adventure-route-distance";
import {
  adventurePayloadForEditForm,
  treasurePayloadForCard,
  clientMapReferenceMarkersFromAdventure,
  cloneJsonForClient,
} from "./_lib/serialize-adventure-admin";
import { AdventureAdminGeneralSection } from "./_components/AdventureAdminGeneralSection";
import { AdventureAdminEnigmasSection } from "./_components/AdventureAdminEnigmasSection";
import { AdventureAdminTreasureSection } from "./_components/AdventureAdminTreasureSection";
import { AdventureAdminBadgeStockSection } from "./_components/AdventureAdminBadgeStockSection";
import { AdventureAdminBadgeRestockRequestForm } from "./_components/AdventureAdminBadgeRestockRequestForm";
import { AdventureAdminPendingBadgeRestockList } from "./_components/AdventureAdminPendingBadgeRestockList";
import { AdventureAdminModerationAside } from "./_components/AdventureAdminModerationAside";
import { listCitiesForAdventureSelect } from "@/lib/city-admin-queries";
import { getBadgeStockOverview } from "./_lib/badge-stock-queries";
import { isSuperadmin } from "@/lib/admin-access";
import {
  getMyBadgeRestockRequestsForAdventure,
  getPendingBadgeRestockRequestsForAdventure,
} from "./_lib/badge-restock-request-queries";
import { listDiscoveryPointsAdmin } from "../../_lib/discovery-point-admin-queries";
import { DiscoveryPointsAdminSection } from "../../_components/DiscoveryPointsAdminSection";
import { AdventureAudience } from "../../../../../../../generated/prisma/client";
import { listAdventureDemoAccess } from "./_lib/demo-access.action";
import { AdventureDemoAccessCard } from "./_components/AdventureDemoAccessCard";
import {
  getPartnerWheelStatsForAdventureAdmin,
  listPartnerLotsForAdventureAdmin,
} from "./_lib/partner-lots-queries";
import { AdventureAdminPartnerLotsSection } from "./_components/AdventureAdminPartnerLotsSection";

export default async function AdventurePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const search = (query.search ?? "").trim();
  const adventure = await getAdventureById(id);

  if (!adventure) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Aventure introuvable ou accès refusé.</p>
      </div>
    );
  }

  const routePolyline = await getAdventureRoutePolylineForMap(id);

  const adventureForMapRefs = {
    latitude: adventure.latitude,
    longitude: adventure.longitude,
    enigmas: adventure.enigmas,
    treasure: adventure.treasure,
  };
  const { all: mapReferenceMarkersAll, withoutTreasure: mapReferenceMarkersNoTreasure } =
    clientMapReferenceMarkersFromAdventure(adventureForMapRefs);

  const enigmaResult = await listEnigmaForAdmin({
    page,
    pageSize: 5,
    search,
    adventureId: id,
  });

  const enigma = enigmaResult.ok ? enigmaResult.enigma : [];
  const total = enigmaResult.ok ? enigmaResult.total : 0;

  const enigmaOrderResult = await listEnigmaOrderForAdmin(id);
  const enigmaOrderRows = enigmaOrderResult.ok ? enigmaOrderResult.rows : [];
  const nextEnigmaNumber =
    enigmaOrderRows.length === 0 ? 1 : Math.max(...enigmaOrderRows.map((r) => r.number)) + 1;
  const enigmaOrderInitial = cloneJsonForClient(enigmaOrderRows);

  const currentUser = await getUser();
  const userIsSuperadmin = isSuperadmin(currentUser?.role);
  const adminScopeSection =
    currentUser?.role === "superadmin" ? await getAdventureAdminScopeEditorData(id) : null;

  const adventurePayload = adventurePayloadForEditForm(adventure, routePolyline);
  const cities = await listCitiesForAdventureSelect();
  const treasurePayload = adventure.treasure ? treasurePayloadForCard(adventure.treasure) : null;
  const badgeStockOverview = await getBadgeStockOverview(id);

  const pendingBadgeRestock =
    userIsSuperadmin && currentUser
      ? (await getPendingBadgeRestockRequestsForAdventure(id)) ?? []
      : [];
  const myBadgeRestockRequests =
    !userIsSuperadmin && currentUser
      ? await getMyBadgeRestockRequestsForAdventure(id, currentUser.id)
      : null;

  const adventureDiscoveryPoints = await listDiscoveryPointsAdmin({
    cityId: adventure.cityId,
    scope: { type: "adventure", adventureId: id },
  });

  const demoAccessRows =
    adventure.audience === AdventureAudience.DEMO
      ? await listAdventureDemoAccess(id)
      : null;

  const partnerLotRows = await listPartnerLotsForAdventureAdmin(id);
  const partnerWheelStats =
    (await getPartnerWheelStatsForAdventureAdmin(id)) ?? { spinsTotal: 0, rows: [] };
  const partnerLotsClient =
    partnerLotRows?.map((r) => ({
      id: r.id,
      partnerName: r.partnerName,
      title: r.title,
      description: r.description,
      redemptionHint: r.redemptionHint,
      weight: r.weight,
      quantityRemaining: r.quantityRemaining,
      active: r.active,
      validFrom: r.validFrom ? r.validFrom.toISOString() : null,
      validUntil: r.validUntil ? r.validUntil.toISOString() : null,
      adventureId: r.adventureId,
      cityId: r.cityId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })) ?? [];

  return (
    <div className="space-y-8 p-4 md:p-6">
      <Link
        href="/admin-game/dashboard/aventures"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Retour à la liste
      </Link>

      <Card className="h-fit">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Informations de l&apos;aventure {adventure.name}
          </CardTitle>
          <CardDescription>ID: {adventure.id}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <AdventureAdminGeneralSection
            adventurePayload={adventurePayload}
            cities={cities}
          />
          {demoAccessRows !== null ? (
            <AdventureDemoAccessCard adventureId={id} initialRows={demoAccessRows} />
          ) : null}
          <AdventureAdminEnigmasSection
            adventureId={adventure.id}
            nextEnigmaNumber={nextEnigmaNumber}
            mapReferenceMarkers={mapReferenceMarkersAll}
            routePolyline={routePolyline}
            enigmas={enigma}
            total={total}
            page={page}
            search={search}
            loadError={enigmaResult.ok ? null : enigmaResult.error}
            enigmaOrderRows={enigmaOrderRows}
            enigmaOrderInitial={enigmaOrderInitial}
          />
          <AdventureAdminTreasureSection
            adventureId={adventure.id}
            hasTreasure={Boolean(adventure.treasure)}
            treasurePayload={treasurePayload}
            mapReferenceMarkers={mapReferenceMarkersNoTreasure}
            routePolyline={routePolyline}
          />
          <AdventureAdminPartnerLotsSection
            adventureId={adventure.id}
            cityId={adventure.cityId}
            cityName={adventure.city.name}
            initialLots={partnerLotsClient}
            initialWheelTerms={adventure.partnerWheelTerms ?? null}
            initialStats={partnerWheelStats}
          />
          {adventureDiscoveryPoints !== null ? (
            <DiscoveryPointsAdminSection
              scope={{
                type: "adventure",
                cityId: adventure.cityId,
                adventureId: adventure.id,
              }}
              initialPoints={adventureDiscoveryPoints}
              mapContext={{
                defaultLatitude: adventure.latitude,
                defaultLongitude: adventure.longitude,
                contextMarkers: mapReferenceMarkersAll,
                routePolyline: routePolyline,
              }}
            />
          ) : null}
          {pendingBadgeRestock.length > 0 ? (
            <AdventureAdminPendingBadgeRestockList
              adventureId={adventure.id}
              initialPending={pendingBadgeRestock}
            />
          ) : null}
          {badgeStockOverview ? (
            <AdventureAdminBadgeStockSection
              adventureId={adventure.id}
              overview={badgeStockOverview}
            />
          ) : null}
          {myBadgeRestockRequests !== null ? (
            <AdventureAdminBadgeRestockRequestForm
              adventureId={adventure.id}
              initialMyRequests={myBadgeRestockRequests}
            />
          ) : null}
        </div>

        <AdventureAdminModerationAside
          adventureId={id}
          adventureName={adventure.name}
          adminScopeSection={adminScopeSection}
          userAdventures={adventure?.userAdventures ?? []}
          adventureReviews={adventure?.adventureReviews ?? []}
        />
      </div>
    </div>
  );
}
