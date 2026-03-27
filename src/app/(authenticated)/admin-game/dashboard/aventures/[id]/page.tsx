import Link from "next/link";
import { getAdventureById } from "./adventure-queries";
import { getAdventureAdminScopeEditorData } from "./adventure-admin-scope-queries";
import { AdventureAdminAssigneesForm } from "./AdventureAdminAssigneesForm";
import { getUser } from "@/lib/auth/auth-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RemoveAdventureForm } from "./RemoveAdventure";
import { AdventureEditFormClient } from "./AdventureEditFormClient";
import { StatusAdventure } from "./StatusAdventure";
import { CreateEnigmaForm } from "./EnigmaCreateForm";
import { ListEnigmaTable } from "./ListeEnigma";
import { EnigmaOrderEditor } from "./EnigmaOrderEditor";
import { listEnigmaForAdmin, listEnigmaOrderForAdmin } from "./enigma-queries";
import { CreateTreasureForm } from "./TreasureCreateForm";
import { TreasureCard } from "./TreasureCard";
import type { AdventureEditFormPayload } from "./adventure-edit-payload";
import type { TreasureEditPayload } from "./treasure-edit-payload";
import { getAdventureRoutePolylineForMap } from "@/lib/adventure-route-distance";
import { buildMapReferenceMarkers } from "./map-reference-markers";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";

/** Props client : JSON pur (évite références / objets non sérialisables côté RSC). */
function adventurePayloadForEditForm(
  adventure: NonNullable<Awaited<ReturnType<typeof getAdventureById>>>,
  routePolyline: [number, number][] | null
): AdventureEditFormPayload {
  const mapContextMarkers: AdventureEditFormPayload["mapContextMarkers"] = [
    ...adventure.enigmas.map((e) => ({
      kind: "enigma" as const,
      id: e.id,
      number: e.number,
      name: e.name,
      latitude: e.latitude,
      longitude: e.longitude,
    })),
  ];
  if (adventure.treasure) {
    mapContextMarkers.push({
      kind: "treasure",
      name: adventure.treasure.name,
      latitude: adventure.treasure.latitude,
      longitude: adventure.treasure.longitude,
    });
  }
  return JSON.parse(
    JSON.stringify({
      id: adventure.id,
      name: adventure.name,
      description: adventure.description,
      city: adventure.city,
      latitude: adventure.latitude,
      longitude: adventure.longitude,
      distance: adventure.distance,
      mapContextMarkers,
      routePolyline,
    })
  ) as AdventureEditFormPayload;
}

function treasurePayloadForCard(
  treasure: NonNullable<
    NonNullable<Awaited<ReturnType<typeof getAdventureById>>>["treasure"]
  >
): TreasureEditPayload {
  return JSON.parse(
    JSON.stringify({
      id: treasure.id,
      name: treasure.name,
      description: treasure.description,
      code: treasure.code,
      safeCode: treasure.safeCode,
      latitude: treasure.latitude,
      longitude: treasure.longitude,
    })
  ) as TreasureEditPayload;
}

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
        <p className="text-muted-foreground">Aventure introuvable ou acces refuse.</p>
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
  const mapReferenceMarkersAll = JSON.parse(
    JSON.stringify(buildMapReferenceMarkers(adventureForMapRefs))
  ) as LocationPickerContextMarker[];
  const mapReferenceMarkersNoTreasure = JSON.parse(
    JSON.stringify(
      buildMapReferenceMarkers(adventureForMapRefs, { omitTreasure: true })
    )
  ) as LocationPickerContextMarker[];

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
    enigmaOrderRows.length === 0
      ? 1
      : Math.max(...enigmaOrderRows.map((r) => r.number)) + 1;
  const enigmaOrderInitial = JSON.parse(
    JSON.stringify(enigmaOrderRows)
  ) as typeof enigmaOrderRows;

  const currentUser = await getUser();
  const adminScopeSection =
    currentUser?.role === "superadmin"
      ? await getAdventureAdminScopeEditorData(id)
      : null;

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
        {/* Colonne principale : contenu éditable (superadmin comme admin client) */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Aperçu en lecture seule ; utilisez « Modifier » pour éditer nom, ville, description
                et point de départ (distance recalculée via OpenRouteService après enregistrement).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdventureEditFormClient
                adventure={adventurePayloadForEditForm(adventure, routePolyline)}
              />
            </CardContent>
          </Card>

          <Card className="relative">
            <div className="absolute inset-e-4 top-4 z-10">
              <CreateEnigmaForm
                nextEnigmaNumber={nextEnigmaNumber}
                mapReferenceMarkers={mapReferenceMarkersAll}
                routePolyline={routePolyline}
              />
            </div>
            <CardHeader className="flex flex-col items-center text-center pe-24 sm:pe-4">
              <CardTitle>Énigmes</CardTitle>
              <CardDescription>Liste des énigmes de cette aventure</CardDescription>
            </CardHeader>
            <CardContent>
              <ListEnigmaTable
                adventureId={adventure.id}
                enigmas={enigma}
                total={total}
                page={page}
                search={search}
                loadError={enigmaResult.ok ? null : enigmaResult.error}
                mapReferenceMarkers={mapReferenceMarkersAll}
                routePolyline={routePolyline}
              />
              {enigmaOrderRows.length > 0 ? (
                <EnigmaOrderEditor
                  adventureId={adventure.id}
                  initialRows={enigmaOrderInitial}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trésor</CardTitle>
              <CardDescription>
                Dernière étape du parcours : position du coffre, texte présenté
                aux joueurs et codes (accès et coffre).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CreateTreasureForm
                hasTreasure={Boolean(adventure.treasure)}
                mapReferenceMarkers={mapReferenceMarkersNoTreasure}
                routePolyline={routePolyline}
              />
              {adventure.treasure ? (
                <TreasureCard
                  adventureId={adventure.id}
                  treasure={treasurePayloadForCard(adventure.treasure)}
                  mapReferenceMarkers={mapReferenceMarkersNoTreasure}
                  routePolyline={routePolyline}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale : actions sensibles + assignation admins (superadmin) */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4">
          <Card>
            <CardHeader>
              <CardTitle>Modération</CardTitle>
              <CardDescription>Changement statut, suppression</CardDescription>
            </CardHeader>
            <CardContent className="mx-auto flex w-full max-w-xs flex-col gap-3">
              <StatusAdventure adventure={{ id: adventure.id }} />
              <RemoveAdventureForm
                adventure={{ id: adventure.id, name: adventure.name }}
              />
            </CardContent>
          </Card>

          {adminScopeSection?.ok ? (
            <Card>
              <CardHeader>
                <CardTitle>Admins sur cette aventure</CardTitle>
                <CardDescription>
                  Comptes admin client autorisés à gérer le contenu (équivalent à la fiche
                  utilisateur).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdventureAdminAssigneesForm
                  adventureId={id}
                  admins={adminScopeSection.admins}
                  initialAssignedIds={adminScopeSection.assignedAdminIds}
                />
              </CardContent>
            </Card>
          ) : adminScopeSection && !adminScopeSection.ok ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{adminScopeSection.error}</p>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
