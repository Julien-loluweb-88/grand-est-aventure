"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Control } from "react-hook-form";
import { buildAdventureRouteWaypointsLonLat } from "@/lib/adventure-route-waypoints";
import { useLiveAdventureRoutePreview } from "@/hooks/use-live-adventure-route-preview";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type SubmitErrorHandler } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTreasure } from "../_lib/treasure.action";
import { adventureDescriptionToTiptapJSON } from "@/lib/adventure-description-tiptap";
import type { TreasureEditPayload } from "../_lib/treasure-edit-payload";
import {
  treasureEditFormSchema,
  type TreasureEditFormValues,
} from "../_lib/treasure-form-schema";
import {
  TreasureFormFields,
  type TreasureFormRhfFragment,
  type TreasureFormUiModel,
} from "./TreasureFormFields";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";

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
    z.input<typeof treasureEditFormSchema>,
    unknown,
    TreasureEditFormValues
  >({
    resolver: zodResolver(treasureEditFormSchema),
    defaultValues: {
      name: treasure.name,
      description: adventureDescriptionToTiptapJSON(treasure.description),
      mapRevealCode: treasure.mapRevealCode,
      mapRevealCodeAlt: treasure.mapRevealCodeAlt ?? "",
      chestCode: treasure.chestCode,
      chestCodeAlt: treasure.chestCodeAlt ?? "",
      latitude: treasure.latitude,
      longitude: treasure.longitude,
      imageUrl: treasure.imageUrl ?? "",
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

  useEffect(() => {
    if (open && !wasDialogOpenRef.current) {
      const t = treasureRef.current;
      form.reset({
        name: t.name,
        description: adventureDescriptionToTiptapJSON(t.description),
        mapRevealCode: t.mapRevealCode,
        mapRevealCodeAlt: t.mapRevealCodeAlt ?? "",
        chestCode: t.chestCode,
        chestCodeAlt: t.chestCodeAlt ?? "",
        latitude: t.latitude,
        longitude: t.longitude,
        imageUrl: t.imageUrl ?? "",
        adventureId,
      });
    }
    wasDialogOpenRef.current = open;
  }, [open, form, adventureId, treasure.id]);

  const onSubmit = useCallback(
    async (data: TreasureEditFormValues) => {
      const plain = JSON.parse(JSON.stringify(data)) as TreasureEditFormValues;
      const result = await updateTreasure(treasure.id, {
        name: plain.name,
        description: plain.description,
        mapRevealCode: plain.mapRevealCode,
        mapRevealCodeAlt: plain.mapRevealCodeAlt?.trim() || null,
        chestCode: plain.chestCode,
        chestCodeAlt: plain.chestCodeAlt?.trim() || null,
        latitude: Number(plain.latitude),
        longitude: Number(plain.longitude),
        imageUrl: plain.imageUrl?.trim() || null,
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

  const onInvalid: SubmitErrorHandler<z.input<typeof treasureEditFormSchema>> = useCallback(() => {
    toast.error("Vérifiez les champs du formulaire.");
  }, []);

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit(onSubmit, onInvalid)(event);
    },
    [form, onInvalid, onSubmit]
  );

  const mapHelperText = `Repères : D départ, énigmes ; itinéraire bleu. Déplacez le trésor (grand marqueur).${routePreviewLoading ? " Recalcul de l'itinéraire…" : ""}`;

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

          <TreasureFormFields
            control={form.control as Control<TreasureFormUiModel>}
            form={form as TreasureFormRhfFragment}
            latitudeValue={latitudeValue}
            longitudeValue={longitudeValue}
            mapReferenceMarkers={mapReferenceMarkers}
            displayRoutePolyline={displayRoutePolyline}
            mapHelperText={mapHelperText}
            canEdit={canEdit}
            fieldSetDescription="Trésor : position, texte, et codes de validation finale (combinaison attendue + variante optionnelle)."
            adventureId={adventureId}
          />

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
