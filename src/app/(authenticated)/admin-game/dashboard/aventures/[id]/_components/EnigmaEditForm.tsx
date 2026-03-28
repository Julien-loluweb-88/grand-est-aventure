"use client";

import type { Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect, useMemo } from "react";
import { buildAdventureRouteWaypointsLonLat } from "@/lib/adventure-route-waypoints";
import { useLiveAdventureRoutePreview } from "@/hooks/use-live-adventure-route-preview";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateEnigma } from "../_lib/enigma.action";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";
import { adventureDescriptionToTiptapJSON } from "@/lib/adventure-description-tiptap";
import {
  enigmaEditFormSchema,
  type EnigmaEditFormValues,
} from "../_lib/enigma-form-schema";
import {
  EnigmaFormFields,
  type EnigmaFormRhfFragment,
  type EnigmaFormUiModel,
} from "./EnigmaFormFields";

/** Ligne liste admin : champs Json sérialisés tels que renvoyés par Prisma. */
export type EnigmaEditRow = {
  id: string;
  name: string;
  number: number;
  question: string;
  uniqueResponse: boolean;
  choices: string[];
  answer: string;
  answerMessage: unknown;
  description: unknown;
  latitude: number;
  longitude: number;
  adventureId: string;
};

export function EditenigmaForm({
  enigma,
  mapReferenceMarkers,
  routePolyline,
}: {
  enigma: EnigmaEditRow;
  mapReferenceMarkers: LocationPickerContextMarker[];
  routePolyline: [number, number][] | null;
}) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const caps = useAdminCapabilities();
  const [open, setOpen] = useState(false);
  const defaultChoices = enigma.choices?.length ? enigma.choices : ["", "", "", ""];

  const form = useForm<
    z.input<typeof enigmaEditFormSchema>,
    unknown,
    EnigmaEditFormValues
  >({
    resolver: zodResolver(enigmaEditFormSchema),
    defaultValues: {
      name: enigma.name,
      number: enigma.number,
      question: enigma.question,
      uniqueResponse: enigma.uniqueResponse ?? false,
      choices: defaultChoices,
      answer: enigma.answer,
      answerMessage: adventureDescriptionToTiptapJSON(enigma.answerMessage),
      description: adventureDescriptionToTiptapJSON(enigma.description),
      latitude: enigma.latitude,
      longitude: enigma.longitude,
      adventureId: params?.id ?? "",
    },
  });
  const latitudeValue = useWatch({ control: form.control, name: "latitude" });
  const longitudeValue = useWatch({ control: form.control, name: "longitude" });
  const numberValue = useWatch({ control: form.control, name: "number" });
  const [choiceInputs, setChoiceInputs] = useState<string[]>(defaultChoices);

  const pickerContextMarkers = useMemo(
    () => mapReferenceMarkers.filter((m) => m.kind !== "enigma" || m.id !== enigma.id),
    [mapReferenceMarkers, enigma.id]
  );

  const waypoints = useMemo(
    () =>
      buildAdventureRouteWaypointsLonLat(mapReferenceMarkers, {
        replaceEnigma: {
          id: enigma.id,
          latitude: Number(latitudeValue ?? enigma.latitude),
          longitude: Number(longitudeValue ?? enigma.longitude),
          number: Number(numberValue ?? enigma.number),
        },
      }),
    [
      enigma.id,
      enigma.latitude,
      enigma.longitude,
      enigma.number,
      latitudeValue,
      longitudeValue,
      mapReferenceMarkers,
      numberValue,
    ]
  );

  const baselineWaypointsSerialized = useMemo(
    () =>
      JSON.stringify(
        buildAdventureRouteWaypointsLonLat(mapReferenceMarkers, {
          replaceEnigma: {
            id: enigma.id,
            latitude: enigma.latitude,
            longitude: enigma.longitude,
            number: enigma.number,
          },
        })
      ),
    [enigma.id, enigma.latitude, enigma.longitude, enigma.number, mapReferenceMarkers]
  );

  const { liveRoute: liveRoutePreview, loading: routePreviewLoading } =
    useLiveAdventureRoutePreview(enigma.adventureId, waypoints, {
      baselineSerialized: baselineWaypointsSerialized,
      enabled: caps.adventure.update && open,
    });

  const displayRoutePolyline =
    liveRoutePreview != null ? liveRoutePreview.polyline : routePolyline;

  useEffect(() => {
    form.setValue("choices", choiceInputs, { shouldValidate: true });
  }, [choiceInputs, form]);

  const syncChoices = (next: string[]) => {
    const currentAnswer = form.getValues("answer");
    setChoiceInputs(next);

    if (typeof currentAnswer !== "string" || currentAnswer.trim() === "") return;

    const selectedIndex = choiceInputs.findIndex((c) => c === currentAnswer);
    if (selectedIndex === -1) return;

    const nextAnswer = next[selectedIndex];
    form.setValue("answer", nextAnswer ?? "", { shouldValidate: true });
  };

  const onSubmit = async (data: EnigmaEditFormValues) => {
    const plain = JSON.parse(JSON.stringify(data)) as EnigmaEditFormValues;
    const result = await updateEnigma(enigma.id, {
      name: plain.name,
      number: Number(plain.number),
      question: plain.question,
      uniqueResponse: plain.uniqueResponse ?? false,
      answer: plain.answer ?? "",
      answerMessage: plain.answerMessage,
      description: plain.description,
      latitude: Number(plain.latitude),
      longitude: Number(plain.longitude),
      adventureId: plain.adventureId,
      choice: plain.choices.filter((c) => c !== ""),
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Énigme mise à jour.");
    setOpen(false);
    router.refresh();
  };

  const mapHelperText = `Repères : D départ, autres énigmes, T trésor ; itinéraire bleu. Déplacez ce point (grand marqueur).${routePreviewLoading ? " Recalcul de l'itinéraire…" : ""}`;

  if (!caps.adventure.update) {
    return (
      <GuardedButton
        type="button"
        variant="outline"
        allowed={false}
        denyReason="Vous ne pouvez pas modifier des énigmes."
      >
        Modifier
      </GuardedButton>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Modifier</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-4xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;énigme</DialogTitle>
            <DialogDescription>
              Modifier l&apos;énigme « {enigma.name} »
            </DialogDescription>
          </DialogHeader>

          <EnigmaFormFields
            control={form.control as Control<EnigmaFormUiModel>}
            form={form as EnigmaFormRhfFragment}
            choiceInputs={choiceInputs}
            syncChoices={syncChoices}
            latitudeValue={latitudeValue}
            longitudeValue={longitudeValue}
            contextMarkers={pickerContextMarkers}
            displayRoutePolyline={displayRoutePolyline}
            mapHelperText={mapHelperText}
            canEdit={caps.adventure.update}
            orderSlot={
              <>
                <Field>
                  <FieldLabel>Ordre dans le parcours</FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    Énigme n°{" "}
                    <span className="font-medium text-foreground">{enigma.number}</span>. Pour
                    changer la suite du parcours, utilisez le bloc{" "}
                    <strong>Ordre des énigmes</strong> sous la liste.
                  </p>
                </Field>
                <Controller
                  name="number"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="hidden"
                      name={field.name}
                      ref={field.ref}
                      value={String(field.value ?? "")}
                      onBlur={field.onBlur}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </>
            }
            wrapFirstBlockInFieldSet={false}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit">Modifier</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
