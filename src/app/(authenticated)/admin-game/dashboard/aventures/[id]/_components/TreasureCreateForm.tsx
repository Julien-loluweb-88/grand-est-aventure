"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
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
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";
import { createTrasure } from "../_lib/treasure.action";
import { EMPTY_TIPTAP_DOCUMENT } from "@/lib/adventure-description-tiptap";
import {
  treasureCreateFormSchema,
  type TreasureCreateFormValues,
} from "../_lib/treasure-form-schema";
import {
  TreasureFormFields,
  type TreasureFormRhfFragment,
  type TreasureFormUiModel,
} from "./TreasureFormFields";

export function CreateTreasureForm({
  hasTreasure = false,
  mapReferenceMarkers,
  routePolyline,
}: {
  hasTreasure?: boolean;
  mapReferenceMarkers: LocationPickerContextMarker[];
  routePolyline: [number, number][] | null;
}) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const caps = useAdminCapabilities();
  const canEdit = caps.adventure.update;
  const [open, setOpen] = useState(false);
  const form = useForm<
    z.input<typeof treasureCreateFormSchema>,
    unknown,
    TreasureCreateFormValues
  >({
    resolver: zodResolver(treasureCreateFormSchema),
    defaultValues: {
      name: "",
      description: EMPTY_TIPTAP_DOCUMENT,
      mapRevealCode: "",
      mapRevealCodeAlt: "",
      chestCode: "",
      chestCodeAlt: "",
      latitude: 48.4072318295932,
      longitude: 6.843844487240165,
      imageUrl: "",
      adventureId: params?.id ?? "",
    },
  });

  const latitudeValue = useWatch({ control: form.control, name: "latitude" });
  const longitudeValue = useWatch({ control: form.control, name: "longitude" });

  const waypoints = useMemo(
    () =>
      buildAdventureRouteWaypointsLonLat(mapReferenceMarkers, {
        treasurePosition: {
          latitude: Number(latitudeValue),
          longitude: Number(longitudeValue),
        },
      }),
    [latitudeValue, longitudeValue, mapReferenceMarkers]
  );

  const baselineSerialized = useMemo(
    () => JSON.stringify(buildAdventureRouteWaypointsLonLat(mapReferenceMarkers)),
    [mapReferenceMarkers]
  );

  const { liveRoute: liveRoutePreview, loading: routePreviewLoading } =
    useLiveAdventureRoutePreview(params?.id ?? "", waypoints, {
      baselineSerialized,
      enabled: canEdit && open,
    });

  const displayRoutePolyline =
    liveRoutePreview != null ? liveRoutePreview.polyline : routePolyline;

  const onSubmit = useCallback(
    async (data: TreasureCreateFormValues) => {
      const plain = JSON.parse(JSON.stringify(data)) as TreasureCreateFormValues;
      const result = await createTrasure({
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
      toast.success(result.message);
      setOpen(false);
      router.refresh();
    },
    [router]
  );

  const onInvalid: SubmitErrorHandler<z.input<typeof treasureCreateFormSchema>> = useCallback(() => {
    toast.error("Vérifiez les champs du formulaire.");
  }, []);

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit(onSubmit, onInvalid)(event);
    },
    [form, onInvalid, onSubmit]
  );

  const mapHelperText = `Repères : D départ, énigmes numérotées ; itinéraire bleu. Placez le trésor (grand marqueur).${routePreviewLoading ? " Recalcul de l'itinéraire…" : ""}`;

  if (!canEdit) {
    return (
      <GuardedButton
        type="button"
        variant="outline"
        allowed={false}
        denyReason="Vous ne pouvez pas créer ou modifier un trésor."
      >
        Créer un trésor
      </GuardedButton>
    );
  }

  if (hasTreasure) {
    return (
      <div
        className="rounded-none border px-4 py-3 text-sm leading-relaxed text-muted-foreground"
        role="status"
      >
        <p className="font-medium text-foreground">Un trésor est déjà défini pour cette aventure.</p>
        <p className="mt-1.5">
          Modifiez-le ou supprimez-le via la fiche ci-dessous (boutons en bas de carte).
        </p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Créer un trésor</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] w-[min(95vw,72rem)] flex-col gap-4 overflow-y-auto p-6 sm:max-w-[min(95vw,72rem)]">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Création d&apos;un trésor</DialogTitle>
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
            adventureId={params?.id ?? ""}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit">Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
