"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FieldCharacterCount } from "@/components/ui/field-character-count";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { EditorialRewriteControl } from "@/components/admin/EditorialRewriteControl";
import { DashboardImageUploadField } from "@/components/uploads/DashboardImageUploadField";
import { useAdminCapabilities } from "../AdminCapabilitiesProvider";
import type { DiscoveryPointAdminRow } from "../_lib/discovery-point-admin-queries";
import {
  DISCOVERY_POINT_TEASER_MAX_CHARS,
  DISCOVERY_POINT_TITLE_MAX_CHARS,
} from "@/lib/dashboard-text-limits";
import {
  createDiscoveryPoint,
  updateDiscoveryPoint,
  deleteDiscoveryPoint,
} from "../discovery-point.action";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";

const DiscoveryLocationMap = dynamic(
  () => import("@/components/location/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-72 w-full max-w-3xl animate-pulse rounded-md border bg-muted/50 sm:h-80"
        aria-hidden
      />
    ),
  }
);

export type DiscoveryScope =
  | { type: "city"; cityId: string }
  | { type: "adventure"; cityId: string; adventureId: string };

/** Centre par défaut + repères optionnels (parcours aventure sur la fiche aventure). */
export type DiscoveryMapContext = {
  defaultLatitude: number;
  defaultLongitude: number;
  contextMarkers?: LocationPickerContextMarker[];
  routePolyline?: [number, number][] | null;
};

type FormState = {
  title: string;
  teaser: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  sortOrder: string;
  imageUrl: string;
};

function freshForm(mc: DiscoveryMapContext): FormState {
  return {
    title: "",
    teaser: "",
    latitude: String(mc.defaultLatitude),
    longitude: String(mc.defaultLongitude),
    radiusMeters: "50",
    sortOrder: "0",
    imageUrl: "",
  };
}

function parseCoord(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function DiscoveryPointsAdminSection({
  scope,
  initialPoints,
  mapContext,
}: {
  scope: DiscoveryScope;
  initialPoints: DiscoveryPointAdminRow[];
  mapContext: DiscoveryMapContext;
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const canEdit = caps.adventure.update;

  const [points, setPoints] = useState(initialPoints);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => freshForm(mapContext));

  useEffect(() => {
    setPoints(initialPoints);
  }, [initialPoints]);

  const startEdit = (p: DiscoveryPointAdminRow) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      teaser: p.teaser ?? "",
      latitude: String(p.latitude),
      longitude: String(p.longitude),
      radiusMeters: String(p.radiusMeters),
      sortOrder: String(p.sortOrder),
      imageUrl: p.imageUrl ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(freshForm(mapContext));
  };

  const onCreate = async () => {
    const lat = parseCoord(form.latitude);
    const lon = parseCoord(form.longitude);
    if (lat == null || lon == null) {
      toast.error("Position invalide : utilisez la carte ou saisissez latitude et longitude.");
      return;
    }
    const cityId = scope.cityId;
    const adventureId = scope.type === "adventure" ? scope.adventureId : null;
    const res = await createDiscoveryPoint({
      cityId,
      adventureId,
      title: form.title,
      teaser: form.teaser,
      latitude: lat,
      longitude: lon,
      radiusMeters: Number(form.radiusMeters),
      sortOrder: Number(form.sortOrder),
      imageUrl: form.imageUrl,
    });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Point de découverte créé.");
    setForm(freshForm(mapContext));
    router.refresh();
  };

  const onUpdate = async () => {
    if (!editingId) return;
    const lat = parseCoord(form.latitude);
    const lon = parseCoord(form.longitude);
    if (lat == null || lon == null) {
      toast.error("Position invalide : utilisez la carte ou saisissez latitude et longitude.");
      return;
    }
    const res = await updateDiscoveryPoint(editingId, {
      title: form.title,
      teaser: form.teaser,
      latitude: lat,
      longitude: lon,
      radiusMeters: Number(form.radiusMeters),
      sortOrder: Number(form.sortOrder),
      imageUrl: form.imageUrl,
    });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Point mis à jour.");
    cancelEdit();
    router.refresh();
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce point et le badge associé (collection joueurs) ?")) {
      return;
    }
    const res = await deleteDiscoveryPoint(id);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Point supprimé.");
    if (editingId === id) cancelEdit();
    router.refresh();
  };

  const titleCard =
    scope.type === "city"
      ? "Points découverte (toute la ville)"
      : "Points découverte (cette aventure)";
  const descCard =
    scope.type === "city"
      ? "Badges optionnels hors quête : visibles pour toute la ville. Réclamation via POST /api/game/claim-discovery."
      : "Réservés aux joueurs qui ont démarré cette aventure. Même API de réclamation.";

  const mapLat = parseCoord(form.latitude) ?? mapContext.defaultLatitude;
  const mapLng = parseCoord(form.longitude) ?? mapContext.defaultLongitude;
  const radiusForCircle = (() => {
    const r = Math.floor(Number(form.radiusMeters));
    return Number.isFinite(r) && r > 0 ? r : 50;
  })();
  const ctxMarkers = mapContext.contextMarkers ?? [];
  const routeLine = mapContext.routePolyline ?? null;

  const editorialScope =
    scope.type === "adventure"
      ? ({ type: "adventure" as const, adventureId: scope.adventureId })
      : ({ type: "city-editorial" as const });

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{titleCard}</CardTitle>
        <CardDescription>{descCard}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {points.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead className="hidden md:table-cell">Lat / long</TableHead>
                <TableHead className="text-right">Rayon (m)</TableHead>
                <TableHead className="text-right w-40"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">
                    {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.radiusMeters}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(p)}>
                      Modifier
                    </Button>
                    <GuardedButton
                      type="button"
                      variant="destructive"
                      size="sm"
                      allowed={canEdit}
                      denyReason="Droit aventure « mise à jour » requis."
                      onClick={() => void onDelete(p.id)}
                    >
                      Suppr.
                    </GuardedButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun point pour l’instant.</p>
        )}

        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium">
            {editingId ? "Modifier le point" : "Nouveau point"}
          </p>
          <FieldGroup className="max-w-xl space-y-3">
            <Field>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FieldLabel htmlFor="dp-title">Titre</FieldLabel>
                {canEdit ? (
                  <EditorialRewriteControl
                    scope={editorialScope}
                    getSourceText={() => form.title}
                    onApply={(t) => setForm((f) => ({ ...f, title: t }))}
                    disabled={!canEdit}
                    dialogTitle="Reformuler le titre"
                    warnIfPlainLengthExceeds={{
                      max: DISCOVERY_POINT_TITLE_MAX_CHARS,
                      label: "Le titre",
                    }}
                  />
                ) : null}
              </div>
              <Input
                id="dp-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                disabled={!canEdit}
              />
              <div className="flex justify-end pt-0.5">
                <FieldCharacterCount
                  length={form.title.length}
                  max={DISCOVERY_POINT_TITLE_MAX_CHARS}
                />
              </div>
            </Field>
            <Field>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FieldLabel htmlFor="dp-teaser">Accroche (optionnel)</FieldLabel>
                {canEdit ? (
                  <EditorialRewriteControl
                    scope={editorialScope}
                    getSourceText={() => form.teaser}
                    onApply={(t) => setForm((f) => ({ ...f, teaser: t }))}
                    disabled={!canEdit}
                    dialogTitle="Reformuler l’accroche"
                    warnIfPlainLengthExceeds={{
                      max: DISCOVERY_POINT_TEASER_MAX_CHARS,
                      label: "L’accroche",
                    }}
                  />
                ) : null}
              </div>
              <Input
                id="dp-teaser"
                value={form.teaser}
                onChange={(e) => setForm((f) => ({ ...f, teaser: e.target.value }))}
                disabled={!canEdit}
                placeholder="Ex. Monte voir la vue sur…"
              />
              <div className="flex justify-end pt-0.5">
                <FieldCharacterCount
                  length={form.teaser.length}
                  max={DISCOVERY_POINT_TEASER_MAX_CHARS}
                />
              </div>
            </Field>
            <Field className="max-w-3xl">
              <FieldLabel>Position sur la carte</FieldLabel>
              <p className="mb-2 text-xs text-muted-foreground">
                Cliquez sur la carte ou déplacez l&apos;épingle. Le disque violet correspond au rayon
                de réclamation. Les coordonnées ci-dessous se mettent à jour automatiquement.
              </p>
              <DiscoveryLocationMap
                latitude={mapLat}
                longitude={mapLng}
                onChange={(c) =>
                  setForm((f) => ({
                    ...f,
                    latitude: String(c.latitude),
                    longitude: String(c.longitude),
                  }))
                }
                contextMarkers={ctxMarkers}
                routePolyline={routeLine}
                radiusMeters={radiusForCircle}
                markerPopupLabel="Point de découverte"
                readOnly={!canEdit}
                mapClassName="h-72 sm:h-80"
              />
            </Field>
            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="dp-lat">Latitude</FieldLabel>
                <Input
                  id="dp-lat"
                  value={form.latitude}
                  onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                  disabled={!canEdit}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="dp-lon">Longitude</FieldLabel>
                <Input
                  id="dp-lon"
                  value={form.longitude}
                  onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                  disabled={!canEdit}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="dp-r">Rayon (m)</FieldLabel>
                <Input
                  id="dp-r"
                  type="number"
                  min={5}
                  max={2000}
                  value={form.radiusMeters}
                  onChange={(e) => setForm((f) => ({ ...f, radiusMeters: e.target.value }))}
                  disabled={!canEdit}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="dp-order">Ordre</FieldLabel>
                <Input
                  id="dp-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  disabled={!canEdit}
                />
              </Field>
            </div>
            <DashboardImageUploadField
              scope="discovery-point"
              label="Image du badge (optionnel)"
              description="JPEG, PNG ou WebP ; stockage sous uploads/badges/discovery/. Vous pouvez aussi coller une URL."
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              disabled={!canEdit}
            />
          </FieldGroup>
          <div className="mt-3 flex flex-wrap gap-2">
            {editingId ? (
              <>
                <GuardedButton
                  type="button"
                  allowed={canEdit}
                  denyReason="Droit aventure « mise à jour » requis."
                  onClick={() => void onUpdate()}
                >
                  Enregistrer
                </GuardedButton>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Annuler
                </Button>
              </>
            ) : (
              <GuardedButton
                type="button"
                allowed={canEdit}
                denyReason="Droit aventure « mise à jour » requis."
                onClick={() => void onCreate()}
              >
                Créer le point
              </GuardedButton>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
