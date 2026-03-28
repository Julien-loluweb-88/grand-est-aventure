"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { buildAdventureRouteWaypointsLonLat } from "@/lib/adventure-route-waypoints";
import { useLiveAdventureRoutePreview } from "@/hooks/use-live-adventure-route-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  Controller,
  useWatch,
  type SubmitErrorHandler,
} from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldError,
} from "@/components/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LocationPicker } from "@/components/location/LocationPicker";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";
import { updateTreasure } from "../_lib/treasure.action";
import { AdventureDescriptionEditor } from "@/components/adventure/AdventureDescriptionEditor";
import { adventureDescriptionToTiptapJSON } from "@/lib/adventure-description-tiptap";
import { adventureDescriptionEditZod } from "@/lib/adventure-description-schema";
import type { TreasureEditPayload } from "../_lib/treasure-edit-payload";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(30, "Le nom ne doit pas dépasser 30 caractères"),
  description: adventureDescriptionEditZod,
  code: z
    .string()
    .min(2, "Le code doit contenir au moins 2 caractères")
    .max(30, "Le code doit être maximum 30 caractères"),
  safeCode: z
    .string()
    .min(2, "Le code de sécurité doit contenir au moins 2 caractères")
    .max(30, "Le code de sécurité ne doit pas dépasser 30 caractères"),
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  adventureId: z.string(),
});

export function TreasureEditForm({
  adventureId,
  treasure,
  mapReferenceMarkers,
  routePolyline,
}: {
  adventureId: string;
  treasure: TreasureEditPayload;
  mapReferenceMarkers: LocationPickerContextMarker[];
  routePolyline: [number, number][] | null;
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const canEdit = caps.adventure.update;
  const [open, setOpen] = useState(false);
  const form = useForm<
    z.input<typeof formSchema>,
    unknown,
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: treasure.name,
      description: adventureDescriptionToTiptapJSON(treasure.description),
      code: treasure.code,
      safeCode: treasure.safeCode ?? "AAA",
      latitude: treasure.latitude,
      longitude: treasure.longitude,
      adventureId,
    },
  });

  const latitudeValue = useWatch({ control: form.control, name: "latitude" });
  const longitudeValue = useWatch({ control: form.control, name: "longitude" });

  const waypoints = useMemo(
    () =>
      buildAdventureRouteWaypointsLonLat(mapReferenceMarkers, {
        treasurePosition: {
          latitude: Number(latitudeValue ?? treasure.latitude),
          longitude: Number(longitudeValue ?? treasure.longitude),
        },
      }),
    [
      latitudeValue,
      longitudeValue,
      mapReferenceMarkers,
      treasure.latitude,
      treasure.longitude,
    ]
  );

  const baselineWaypointsSerialized = useMemo(
    () =>
      JSON.stringify(
        buildAdventureRouteWaypointsLonLat(mapReferenceMarkers, {
          treasurePosition: {
            latitude: treasure.latitude,
            longitude: treasure.longitude,
          },
        })
      ),
    [mapReferenceMarkers, treasure.latitude, treasure.longitude]
  );

  const { liveRoute: liveRoutePreview, loading: routePreviewLoading } =
    useLiveAdventureRoutePreview(adventureId, waypoints, {
      baselineSerialized: baselineWaypointsSerialized,
      enabled: canEdit && open,
    });

  const displayRoutePolyline =
    liveRoutePreview != null ? liveRoutePreview.polyline : routePolyline;

  const treasureRef = useRef(treasure);
  treasureRef.current = treasure;
  const wasDialogOpenRef = useRef(false);

  /* Réinitialiser uniquement à l’ouverture du dialogue. Avant : effet dépendant de `treasure`
   * (référence ou re-rendus) pouvait rappeler reset pendant l’édition / après l’aperçu ORS
   * et ramenait lat/lng serveur → le marqueur « sautait ». */
  useEffect(() => {
    if (open && !wasDialogOpenRef.current) {
      const t = treasureRef.current;
      form.reset({
        name: t.name,
        description: adventureDescriptionToTiptapJSON(t.description),
        code: t.code,
        safeCode: t.safeCode ?? "AAA",
        latitude: t.latitude,
        longitude: t.longitude,
        adventureId,
      });
    }
    wasDialogOpenRef.current = open;
  }, [open, form, adventureId]);

  const onSubmit = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      const plain = JSON.parse(JSON.stringify(data)) as z.infer<typeof formSchema>;
      const result = await updateTreasure(treasure.id, {
        name: plain.name,
        description: plain.description,
        code: plain.code,
        safeCode: plain.safeCode,
        latitude: Number(plain.latitude),
        longitude: Number(plain.longitude),
        adventureId: plain.adventureId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Trésor mis à jour.");
      setOpen(false);
      router.refresh();
    },
    [router, treasure.id]
  );

  const onInvalid: SubmitErrorHandler<z.input<typeof formSchema>> = useCallback(
    () => {
      toast.error("Vérifiez les champs du formulaire.");
    },
    []
  );

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit(onSubmit, onInvalid)(event);
    },
    [form, onInvalid, onSubmit]
  );

  if (!canEdit) {
    return (
      <GuardedButton
        type="button"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto sm:min-w-[8.5rem]"
        allowed={false}
        denyReason="Vous ne pouvez pas modifier ce trésor."
      >
        Modifier
      </GuardedButton>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto sm:min-w-[8.5rem]"
        >
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] w-[min(95vw,72rem)] flex-col gap-4 overflow-y-auto p-6 sm:max-w-[min(95vw,72rem)]">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Modifier le trésor</DialogTitle>
          </DialogHeader>

          <FieldGroup className="space-y-4">
            <FieldSet>
              <FieldDescription>Formulaire de la création de trésors</FieldDescription>
              <div className="grid gap-3 md:grid-cols-2">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Nom de trésor</FieldLabel>
                      <Input
                        className="w-100!"
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                        placeholder="Ex. : nom du trésor"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="code"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Code</FieldLabel>
                      <Input
                        className="w-100!"
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                        placeholder="Le code d'énigme"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="safeCode"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Code de sécurité</FieldLabel>
                      <Input
                        className="w-100!"
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                        placeholder="Le code du coffre"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
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
                        helperText={`Repères : D départ, énigmes ; itinéraire bleu. Déplacez le trésor (grand marqueur).${routePreviewLoading ? " Recalcul de l'itinéraire…" : ""
                          }`}
                        contextMarkers={mapReferenceMarkers}
                        routePolyline={displayRoutePolyline}
                      />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Input
                          {...field}
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          autoComplete="off"
                          value={String(field.value ?? "")}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        <Input
                          name="longitude"
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          autoComplete="off"
                          value={String(longitudeValue ?? "")}
                          onChange={(e) =>
                            form.setValue("longitude", Number(e.target.value), {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                      {form.formState.errors.longitude && (
                        <FieldError errors={[form.formState.errors.longitude]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FieldGroup>
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                      <AdventureDescriptionEditor
                        id={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!canEdit}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  </FieldGroup>
                )}
              />
            </FieldSet>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
