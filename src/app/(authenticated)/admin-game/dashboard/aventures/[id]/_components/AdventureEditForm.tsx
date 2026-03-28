"use client";

import dynamic from "next/dynamic";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import * as z from "zod";
import { MapPin, Route } from "lucide-react";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
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
import {
  adventureDescriptionToTiptapJSON,
  tiptapStoredValueToPlainText,
} from "@/lib/adventure-description-tiptap";
import { adventureDescriptionEditZod } from "@/lib/adventure-description-schema";
import type { AdventureEditFormPayload } from "../_lib/adventure-edit-payload";
import { buildAdventureRouteWaypointsLonLat } from "@/lib/adventure-route-waypoints";
import { useLiveAdventureRoutePreview } from "@/hooks/use-live-adventure-route-preview";

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
    .max(30, "Le nom ne doit pas dépasser 30 caractères"),
  description: adventureDescriptionEditZod,
  city: z
    .string()
    .min(2, "Le nom de la ville doit contenir au moins 2 caractères")
    .max(50, "Le nom de la ville ne doit pas dépasser 50 caractères"),
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
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
}: {
  adventure: AdventureEditFormPayload;
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: adventure.name,
      city: adventure.city,
      latitude: adventure.latitude,
      longitude: adventure.longitude,
      description: adventureDescriptionToTiptapJSON(adventure.description),
    },
  });
  const latitudeValue = useWatch({ control: form.control, name: "latitude" });
  const longitudeValue = useWatch({ control: form.control, name: "longitude" });

  const adventureRef = useRef(adventure);
  adventureRef.current = adventure;
  const wasDialogOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasDialogOpenRef.current) {
      const a = adventureRef.current;
      form.reset({
        name: a.name,
        city: a.city,
        latitude: a.latitude,
        longitude: a.longitude,
        description: adventureDescriptionToTiptapJSON(a.description),
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
              <p className="font-medium text-foreground">{adventure.city}</p>
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
                            <FieldLabel htmlFor={field.name}>
                              Nom d&apos;aventure
                            </FieldLabel>
                            <Input
                              className="w-full"
                              {...field}
                              id={field.name}
                              aria-invalid={fieldState.invalid}
                              autoComplete="off"
                              placeholder="Nouvelle aventure"
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Controller
                        name="city"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Ville</FieldLabel>
                            <Input
                              className="max-w-md"
                              {...field}
                              id={field.name}
                              aria-invalid={fieldState.invalid}
                              autoComplete="off"
                              placeholder="Paris"
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
                                helperText={
                                  (displayRoutePolyline &&
                                    displayRoutePolyline.length >= 2) ||
                                    (adventure.routePolyline &&
                                      adventure.routePolyline.length >= 2)
                                    ? `Trait bleu : itinéraire OpenRouteService. Marqueurs : départ (déplaçable), énigmes, trésor (T).${routePreviewLoading
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
          Départ (marqueur classique), repères des énigmes et du trésor ; ligne bleue si
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
            mapClassName="min-h-[220px] sm:h-72"
          />
        </div>
      </div>
    </div>
  );
}
