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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
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
import { createEnigma } from "../_lib/enigma.action";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";
import { EMPTY_TIPTAP_DOCUMENT } from "@/lib/adventure-description-tiptap";
import {
  enigmaCreateFormSchema,
  type EnigmaCreateFormValues,
} from "../_lib/enigma-form-schema";
import {
  EnigmaFormFields,
  type EnigmaFormRhfFragment,
  type EnigmaFormUiModel,
} from "./EnigmaFormFields";

export function CreateEnigmaForm({
  nextEnigmaNumber,
  mapReferenceMarkers,
  routePolyline,
}: {
  nextEnigmaNumber: number;
  mapReferenceMarkers: LocationPickerContextMarker[];
  routePolyline: [number, number][] | null;
}) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const caps = useAdminCapabilities();
  const canEdit = caps.adventure.update;
  const [open, setOpen] = useState(false);
  const form = useForm<
    z.input<typeof enigmaCreateFormSchema>,
    unknown,
    EnigmaCreateFormValues
  >({
    resolver: zodResolver(enigmaCreateFormSchema),
    defaultValues: {
      name: "",
      question: "",
      uniqueResponse: false,
      choices: ["", "", "", ""],
      answer: "",
      answerMessage: EMPTY_TIPTAP_DOCUMENT,
      description: EMPTY_TIPTAP_DOCUMENT,
      latitude: 48.4072318295932,
      longitude: 6.843844487240165,
      imageUrl: "",
      adventureId: params?.id ?? "",
    },
  });
  const latitudeValue = useWatch({ control: form.control, name: "latitude" });
  const longitudeValue = useWatch({ control: form.control, name: "longitude" });

  const [choiceInputs, setChoiceInputs] = useState<string[]>(["", "", "", ""]);

  const waypoints = useMemo(
    () =>
      buildAdventureRouteWaypointsLonLat(mapReferenceMarkers, {
        extraEnigma: {
          number: nextEnigmaNumber,
          latitude: Number(latitudeValue),
          longitude: Number(longitudeValue),
        },
      }),
    [latitudeValue, longitudeValue, mapReferenceMarkers, nextEnigmaNumber]
  );

  const baselineSerialized = useMemo(
    () => JSON.stringify(buildAdventureRouteWaypointsLonLat(mapReferenceMarkers)),
    [mapReferenceMarkers]
  );

  const adventureId = params?.id ?? "";
  const { liveRoute: liveRoutePreview, loading: routePreviewLoading } =
    useLiveAdventureRoutePreview(adventureId, waypoints, {
      baselineSerialized,
      enabled: canEdit && open,
    });

  const displayRoutePolyline =
    liveRoutePreview != null ? liveRoutePreview.polyline : routePolyline;

  const syncChoices = (next: string[]) => {
    const currentAnswer = form.getValues("answer");
    const selectedIndex =
      typeof currentAnswer === "string" ? choiceInputs.findIndex((c) => c === currentAnswer) : -1;

    if (selectedIndex >= 0) {
      const updatedAnswer = next[selectedIndex] ?? "";
      form.setValue("answer", updatedAnswer, { shouldValidate: true, shouldDirty: true });
    } else if (
      typeof currentAnswer === "string" &&
      currentAnswer.trim() !== "" &&
      !next.includes(currentAnswer)
    ) {
      form.setValue("answer", "", { shouldValidate: true, shouldDirty: true });
    }

    setChoiceInputs(next);
    form.setValue("choices", next, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = useCallback(
    async (data: EnigmaCreateFormValues) => {
      const plain = JSON.parse(JSON.stringify(data)) as EnigmaCreateFormValues;
      const result = await createEnigma({
        name: plain.name,
        question: plain.question,
        uniqueResponse: plain.uniqueResponse ?? false,
        answer: plain.answer ?? "",
        answerMessage: plain.answerMessage,
        description: plain.description,
        latitude: Number(plain.latitude),
        longitude: Number(plain.longitude),
        imageUrl: plain.imageUrl?.trim() || null,
        adventureId: plain.adventureId,
        choice: plain.choices.filter((c) => c !== ""),
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

  const onInvalid: SubmitErrorHandler<z.input<typeof enigmaCreateFormSchema>> = useCallback(() => {
    toast.error("Vérifiez les champs du formulaire.");
  }, []);

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit(onSubmit, onInvalid)(event);
    },
    [form, onInvalid, onSubmit]
  );

  const mapHelperText = `Repères : D départ, numéros = énigmes, T = trésor ; trait bleu = itinéraire ORS. Placez la nouvelle énigme (grand marqueur bleu).${routePreviewLoading ? " Recalcul de l'itinéraire…" : ""}`;

  if (!canEdit) {
    return (
      <GuardedButton
        type="button"
        variant="outline"
        allowed={false}
        denyReason="Vous ne pouvez pas créer ou modifier des énigmes."
      >
        Créer une énigme
      </GuardedButton>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Créer une énigme</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-4xl">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Création d&apos;énigme</DialogTitle>
          </DialogHeader>

          <EnigmaFormFields
            control={form.control as Control<EnigmaFormUiModel>}
            form={form as EnigmaFormRhfFragment}
            choiceInputs={choiceInputs}
            syncChoices={syncChoices}
            latitudeValue={latitudeValue}
            longitudeValue={longitudeValue}
            contextMarkers={mapReferenceMarkers}
            displayRoutePolyline={displayRoutePolyline}
            mapHelperText={mapHelperText}
            canEdit={canEdit}
            adventureId={adventureId}
            orderSlot={
              <Field>
                <FieldLabel>Numéro d&apos;ordre</FieldLabel>
                <FieldDescription>
                  Cette énigme sera la n°{" "}
                  <span className="font-semibold text-foreground">{nextEnigmaNumber}</span> dans le
                  parcours (attribution automatique). Vous pourrez réorganiser l&apos;ordre après
                  création.
                </FieldDescription>
              </Field>
            }
            wrapFirstBlockInFieldSet
            fieldSetIntro={
              <FieldDescription>Formulaire de la création d&apos;énigme</FieldDescription>
            }
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
