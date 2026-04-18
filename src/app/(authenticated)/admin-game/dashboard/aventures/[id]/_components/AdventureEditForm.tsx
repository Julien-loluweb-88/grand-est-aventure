"use client";

import dynamic from "next/dynamic";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import * as z from "zod";
import { MapPin, Route } from "lucide-react";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { FieldCharacterCount } from "@/components/ui/field-character-count";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateAdventure } from "../_lib/update-adventure.action";
import { LocationPicker } from "@/components/location/LocationPicker";
import { AdventureDescriptionEditor } from "@/components/adventure/AdventureDescriptionEditor";
import { EditorialRewriteControl } from "@/components/admin/EditorialRewriteControl";
import {
  adventureDescriptionToTiptapJSON,
  tiptapStoredValueToPlainText,
} from "@/lib/adventure-description-tiptap";
import { adventureDescriptionEditZod } from "@/lib/adventure-description-schema";
import {
  ADVENTURE_NAME_MAX_CHARS,
  RICH_TEXT_PLAIN_MAX_CHARS,
} from "@/lib/dashboard-text-limits";
import type { AdventureEditFormPayload } from "../_lib/adventure-edit-payload";
import { buildAdventureRouteWaypointsLonLat } from "@/lib/adventure-route-waypoints";
import { useLiveAdventureRoutePreview } from "@/hooks/use-live-adventure-route-preview";
import { AdventureMediaFields } from "@/components/adventure/AdventureMediaFields";
import type { CitySelectOption } from "@/lib/city-types";

function formatDurationFr(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) {
    return "—";
  }
  const s = Math.round(seconds);
  if (s < 90) {
    return `${s} s`;
  }
  const minutes = Math.round(s / 60);
  if (minutes < 120) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const rm = minutes % 60;
  return rm > 0 ? `${h} h ${rm} min` : `${h} h`;
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdventureReadOnlyMap = dynamic(
  () => import("@/components/location/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[220px] w-full animate-pulse rounded-md border bg-muted/50 sm:h-72"
        aria-hidden
      />
    ),
  }
);

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(
      ADVENTURE_NAME_MAX_CHARS,
      `Le nom ne doit pas dépasser ${ADVENTURE_NAME_MAX_CHARS} caractères.`
    ),
  description: adventureDescriptionEditZod,
  cityId: z.string().min(1, "Choisissez une ville dans la liste."),
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  coverImageUrl: z.string().max(2048).optional().default(""),
  badgeImageUrl: z.string().max(2048).optional().default(""),
  physicalBadgeStockCount: z.coerce.number().int().min(0).max(100_000).default(0),
  audience: z.enum(["PUBLIC", "DEMO"]),
});

const FORM_ID = "adventure-edit-form";

function formatCoord(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });
}

export function AdventureEditForm({
  adventure,
  cities,
}: {
  adventure: AdventureEditFormPayload;
  cities: CitySelectOption[];
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: adventure.name,
      cityId: adventure.cityId,
      latitude: adventure.latitude,
      longitude: adventure.longitude,
      description: adventureDescriptionToTiptapJSON(adventure.description),
      coverImageUrl: adventure.coverImageUrl ?? "",
      badgeImageUrl: adventure.badgeImageUrl ?? "",
      physicalBadgeStockCount: adventure.physicalBadgeStockCount ?? 0,
      audience: adventure.audience,
    },
  });
  const latitudeValue = useWatch({ control: form.control, name: "latitude" });
  const longitudeValue = useWatch({ control: form.control, name: "longitude" });
  const coverImageUrlValue = useWatch({ control: form.control, name: "coverImageUrl" });
  const badgeImageUrlValue = useWatch({ control: form.control, name: "badgeImageUrl" });
  const nameValue = useWatch({ control: form.control, name: "name" });

  const adventureRef = useRef(adventure);
  adventureRef.current = adventure;
  const wasDialogOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasDialogOpenRef.current) {
      const a = adventureRef.current;
      form.reset({
        name: a.name,
        cityId: a.cityId,
        latitude: a.latitude,
        longitude: a.longitude,
        description: adventureDescriptionToTiptapJSON(a.description),
        coverImageUrl: a.coverImageUrl ?? "",
        badgeImageUrl: a.badgeImageUrl ?? "",
        physicalBadgeStockCount: a.physicalBadgeStockCount ?? 0,
        audience: a.audience,
      });
    }
    wasDialogOpenRef.current = open;
  }, [open, form, adventure.id]);

  const waypoints = useMemo(
    () =>
      buildAdventureRouteWaypointsLonLat(adventure.mapContextMarkers, {
        departure: {
          latitude: Number(latitudeValue ?? adventure.latitude),
          longitude: Number(longitudeValue ?? adventure.longitude),
        },
      }),
    [
      adventure.latitude,
      adventure.longitude,
      adventure.mapContextMarkers,
      latitudeValue,
      longitudeValue,
    ]
  );

  const baselineWaypointsSerialized = useMemo(
    () =>
      JSON.stringify(
        buildAdventureRouteWaypointsLonLat(adventure.mapContextMarkers, {
          departure: {
            latitude: adventure.latitude,
            longitude: adventure.longitude,
          },
        })
      ),
    [adventure.latitude, adventure.longitude, adventure.mapContextMarkers]
  );

  const { liveRoute, loading: routePreviewLoading } = useLiveAdventureRoutePreview(
    adventure.id,
    waypoints,
    {
      baselineSerialized: baselineWaypointsSerialized,
      enabled: caps.adventure.update && open,
    }
  );

  const displayRoutePolyline =
    liveRoute != null ? liveRoute.polyline : adventure.routePolyline;
  const displayDistanceKm =
    liveRoute != null ? liveRoute.distanceKm : adventure.distance;

  const descPlain = tiptapStoredValueToPlainText(adventure.description);

  const mapNoop = useCallback(() => { }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const plain = JSON.parse(JSON.stringify(data)) as z.infer<typeof formSchema>;
    const result = await updateAdventure(adventure.id, plain);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Aventure mise à jour.");
    setOpen(false);
    router.refresh();
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(onSubmit, () => {
      toast.error(
        "Vérifiez les champs du formulaire (description, coordonnées, etc.)."
      );
    })(e);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Aventure
            </p>
            <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
              {adventure.name}
            </h3>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                Ville
              </p>
              <p className="font-medium text-foreground">{adventure.cityName}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                Visibilité
              </p>
              <p className="font-medium text-foreground">
                {adventure.audience === "DEMO" ? "Démo (restreinte)" : "Publique"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                Distance parcours
              </p>
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <Route className="size-3.5 shrink-0 opacity-70" aria-hidden />
                {adventure.distance != null
                  ? `${adventure.distance.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} km`
                  : "Non calculée"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                Durée estimée (parcours)
              </p>
              <p className="font-medium text-foreground">{formatDurationFr(adventure.estimatedPlayDurationSeconds)}</p>
              <p className="text-[10px] text-muted-foreground/90">Heuristique (marche + énigmes + trésor)</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                Durée moyenne (joueurs)
              </p>
              <p className="font-medium text-foreground">
                {formatDurationFr(adventure.averagePlayDurationSeconds)}
              </p>
              <p className="text-[10px] text-muted-foreground/90">
                {adventure.playDurationSampleCount > 0
                  ? `${adventure.playDurationSampleCount} partie(s) — moyenne affichée à partir de 5 succès`
                  : "Pas encore de données"}
                {adventure.playDurationStatsUpdatedAt
                  ? ` · MAJ ${new Date(adventure.playDurationStatsUpdatedAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}`
                  : ""}
              </p>
            </div>
          </div>
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="font-mono tabular-nums">
              {formatCoord(adventure.latitude)}°, {formatCoord(adventure.longitude)}°
            </span>
            <span className="text-muted-foreground/80">(départ)</span>
          </p>
          {descPlain ? (
            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {descPlain}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Aucune description renseignée.
            </p>
          )}
          {(adventure.coverImageUrl || adventure.badgeImageUrl) ? (
            <div className="flex flex-wrap gap-3 pt-2">
              {adventure.coverImageUrl ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Présentation
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={adventure.coverImageUrl}
                    alt=""
                    className="h-20 w-auto max-w-[8rem] rounded border object-cover"
                  />
                </div>
              ) : null}
              {adventure.badgeImageUrl ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Badge
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={adventure.badgeImageUrl}
                    alt=""
                    className="h-20 w-auto max-w-[8rem] rounded-full border object-cover"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 sm:pt-6">
          {caps.adventure.update ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Modifier
                </Button>
              </DialogTrigger>
              <DialogContent className="flex max-h-[92vh] w-[min(95vw,72rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(95vw,72rem)]">
                <div className="flex max-h-[92vh] flex-col gap-4 overflow-y-auto p-6">
                  <DialogHeader>
                    <DialogTitle>Modifier l&apos;aventure</DialogTitle>
                  </DialogHeader>
                  <form id={FORM_ID} onSubmit={handleFormSubmit}>
                    <FieldGroup>
                      <Controller
                        name="name"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <FieldLabel htmlFor={field.name}>
                                Nom d&apos;aventure
                              </FieldLabel>
                              {caps.adventure.update ? (
                                <EditorialRewriteControl
                                  scope={{ type: "adventure", adventureId: adventure.id }}
                                  getSourceText={() => String(field.value ?? "")}
                                  onApply={(t) => field.onChange(t)}
                                  disabled={!caps.adventure.update}
                                  dialogTitle="Reformuler le nom d’aventure"
                                  warnIfPlainLengthExceeds={{
                                    max: ADVENTURE_NAME_MAX_CHARS,
                                    label: "Le nom d’aventure",
                                  }}
                                />
                              ) : null}
                            </div>
                            <Input
                              className="w-full"
                              {...field}
                              id={field.name}
                              aria-invalid={fieldState.invalid}
                              autoComplete="off"
                              placeholder="Nouvelle aventure"
                            />
                            <div className="flex justify-end pt-0.5">
                              <FieldCharacterCount
                                length={String(nameValue ?? "").length}
                                max={ADVENTURE_NAME_MAX_CHARS}
                              />
                            </div>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Controller
                        name="cityId"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Ville</FieldLabel>
                            <p className="mb-1 text-xs text-muted-foreground">
                              <Link
                                href="/admin-game/dashboard/villes"
                                className="text-foreground underline underline-offset-2 hover:text-primary"
                              >
                                Gérer les villes
                              </Link>
                            </p>
                            <Select
                              value={field.value || undefined}
                              onValueChange={field.onChange}
                              disabled={cities.length === 0}
                            >
                              <SelectTrigger
                                id={field.name}
                                className="w-full max-w-md"
                                aria-invalid={fieldState.invalid}
                              >
                                <SelectValue
                                  placeholder={
                                    cities.length === 0
                                      ? "Aucune ville"
                                      : "Choisir une ville"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {cities.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Controller
                        name="audience"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Visibilité</FieldLabel>
                            <p className="mb-1 text-xs text-muted-foreground">
                              Public : catalogue et application joueur. Démo : visible uniquement
                              pour les administrateurs et les comptes ajoutés ci‑dessous (section
                              dédiée sur la fiche).
                            </p>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!caps.adventure.update}
                            >
                              <SelectTrigger
                                id={field.name}
                                className="w-full max-w-md"
                                aria-invalid={fieldState.invalid}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PUBLIC">Publique</SelectItem>
                                <SelectItem value="DEMO">Démo (restreinte)</SelectItem>
                              </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <AdventureMediaFields
                        adventureId={adventure.id}
                        disabled={!caps.adventure.update}
                        coverImageUrl={coverImageUrlValue ?? ""}
                        badgeImageUrl={badgeImageUrlValue ?? ""}
                        onCoverChange={(v) =>
                          form.setValue("coverImageUrl", v, { shouldDirty: true })
                        }
                        onBadgeChange={(v) =>
                          form.setValue("badgeImageUrl", v, { shouldDirty: true })
                        }
                      />
                      <Controller
                        name="physicalBadgeStockCount"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>
                              Stock de badges physiques
                            </FieldLabel>
                            <p className="mb-1 text-xs text-muted-foreground">
                              Exemplaires numérotés dans le trésor (0 = pas de suivi). Réduire
                              n’est possible qu’en retirant des exemplaires encore disponibles.
                            </p>
                            <Input
                              {...field}
                              id={field.name}
                              type="number"
                              min={0}
                              step={1}
                              value={
                                field.value === undefined || field.value === null
                                  ? ""
                                  : String(field.value)
                              }
                              onChange={(e) => {
                                const v =
                                  e.target.value === "" ? 0 : Number(e.target.value);
                                field.onChange(Number.isNaN(v) ? 0 : v);
                              }}
                              className="max-w-xs"
                              autoComplete="off"
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <div className="flex flex-col gap-4">
                        <Field>
                          <FieldLabel>Distance du parcours (itinéraire)</FieldLabel>
                          <p className="text-sm text-foreground">
                            {routePreviewLoading ? (
                              <>Calcul de l&apos;itinéraire…</>
                            ) : displayDistanceKm != null ? (
                              <>
                                {displayDistanceKm.toLocaleString("fr-FR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                km
                                {liveRoute != null ? (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    (aperçu — enregistrer pour sauvegarder)
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              "Non calculée (moins de deux points, clé API absente ou erreur OpenRouteService)."
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ordre : départ → énigmes (par numéro) → trésor si présent.
                            Profil par défaut :{" "}
                            <code className="rounded bg-muted px-1">foot-walking</code>
                            .
                          </p>
                        </Field>
                        <Controller
                          name="latitude"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field
                              data-invalid={
                                fieldState.invalid ||
                                Boolean(form.formState.errors.longitude)
                              }
                            >
                              <FieldLabel>Position sur la carte</FieldLabel>
                              <LocationPicker
                                latitude={Number(latitudeValue ?? 0)}
                                longitude={Number(longitudeValue ?? 0)}
                                onChange={({ latitude, longitude }) => {
                                  form.setValue("latitude", latitude, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  form.setValue("longitude", longitude, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                }}
                                editableMarkerKind="departure"
                                helperText={
                                  (displayRoutePolyline &&
                                    displayRoutePolyline.length >= 2) ||
                                    (adventure.routePolyline &&
                                      adventure.routePolyline.length >= 2)
                                    ? `Trait bleu : itinéraire OpenRouteService. Marqueurs : départ (D, déplaçable), énigmes, trésor (T).${routePreviewLoading
                                      ? " Recalcul en cours…"
                                      : ""
                                    }`
                                    : `Configurez OPENROUTESERVICE_API_KEY et ayez au moins deux étapes pour le tracé.${routePreviewLoading
                                      ? " Recalcul en cours…"
                                      : ""
                                    }`
                                }
                                contextMarkers={adventure.mapContextMarkers}
                                routePolyline={displayRoutePolyline}
                              />
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <Input
                                  className="w-full"
                                  {...field}
                                  id={field.name}
                                  aria-invalid={fieldState.invalid}
                                  autoComplete="off"
                                  type="number"
                                  step="any"
                                  value={String(field.value ?? "")}
                                  placeholder="Latitude"
                                />
                                <Input
                                  className="w-full"
                                  name="longitude"
                                  aria-invalid={Boolean(
                                    form.formState.errors.longitude
                                  )}
                                  autoComplete="off"
                                  type="number"
                                  step="any"
                                  value={String(longitudeValue ?? "")}
                                  placeholder="Longitude"
                                  onChange={(e) =>
                                    form.setValue(
                                      "longitude",
                                      Number(e.target.value),
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      }
                                    )
                                  }
                                />
                              </div>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                              {form.formState.errors.longitude && (
                                <FieldError
                                  errors={[form.formState.errors.longitude]}
                                />
                              )}
                            </Field>
                          )}
                        />
                      </div>
                      <Controller
                        name="description"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                            <AdventureDescriptionEditor
                              id={field.name}
                              value={field.value}
                              onChange={field.onChange}
                              disabled={!caps.adventure.update}
                              aria-invalid={fieldState.invalid}
                              richTextImageUploadAdventureId={adventure.id}
                              editorialRewrite={
                                caps.adventure.update
                                  ? {
                                      scope: {
                                        type: "adventure",
                                        adventureId: adventure.id,
                                      },
                                      plainCharacterCountMax: RICH_TEXT_PLAIN_MAX_CHARS,
                                    }
                                  : undefined
                              }
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </form>
                </div>
                <DialogFooter className="gap-2 border-t p-4 sm:gap-0">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Annuler
                    </Button>
                  </DialogClose>
                  <GuardedButton
                    type="submit"
                    form={FORM_ID}
                    allowed={caps.adventure.update}
                    denyReason="Vous ne pouvez pas modifier une aventure."
                  >
                    Enregistrer
                  </GuardedButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <GuardedButton
              type="button"
              variant="outline"
              allowed={false}
              denyReason="Vous ne pouvez pas modifier une aventure."
            >
              Modifier
            </GuardedButton>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Parcours sur la carte
        </p>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          Départ (D), repères des énigmes et du trésor ; ligne bleue si
          l&apos;itinéraire OpenRouteService est disponible. Modification via « Modifier ».
        </p>
        <div className="mt-3">
          <AdventureReadOnlyMap
            readOnly
            latitude={adventure.latitude}
            longitude={adventure.longitude}
            onChange={mapNoop}
            contextMarkers={adventure.mapContextMarkers}
            routePolyline={adventure.routePolyline}
            editableMarkerKind="departure"
            mapClassName="min-h-[220px] sm:h-72"
          />
        </div>
      </div>
    </div>
  );
}
