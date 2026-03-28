"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { buildAdventureRouteWaypointsLonLat } from "@/lib/adventure-route-waypoints"
import { useLiveAdventureRoutePreview } from "@/hooks/use-live-adventure-route-preview"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, useWatch, type SubmitErrorHandler } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { GuardedButton } from "@/components/admin/GuardedButton"
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldError,
} from "@/components/ui/field"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner";
import { createEnigma } from "../_lib/enigma.action"
import { LocationPicker } from "@/components/location/LocationPicker"
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types"
import { AdventureDescriptionEditor } from "@/components/adventure/AdventureDescriptionEditor";
import { EMPTY_TIPTAP_DOCUMENT } from "@/lib/adventure-description-tiptap";
import {
  adventureDescriptionCreateZod,
  enigmaAnswerMessageCreateZod,
} from "@/lib/adventure-description-schema";


const formSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(30, "Le nom ne doit pas dépasser 30 caractères"),
  question: z
    .string()
    .min(10, "La question doit comporter au moins 10 caractères")
    .max(250, "La question ne doit pas dépasser 250 caractères"),
  uniqueResponse: z
    .boolean().optional(),
  choices: z
    .array(z.string()),
  answer: z
    .string()
    .optional(),
  answerMessage: enigmaAnswerMessageCreateZod,
  description: adventureDescriptionCreateZod,
  adventureId:
    z.string(),
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide")
})
  .superRefine((data, ctx) => {
    const hasUnique = data.uniqueResponse === true;
    const hasAnswer = data.answer && data.answer.trim() !== "";
    const nonEmptyChoices = data.choices.map((c) => c.trim()).filter((c) => c !== "");
    const hasChoices = nonEmptyChoices.length > 0;

    if (!hasUnique && !hasAnswer && !hasChoices) {
      ctx.addIssue({
        code: "custom",
        message:
          "Vous devez remplir uniqueResponse ou answer ou des choix",
        path: ["answer"],
      });
    }

    if (hasChoices && !hasAnswer) {
      ctx.addIssue({
        code: "custom",
        message: "Sélectionnez une bonne réponse parmi les choix.",
        path: ["answer"],
      });
    }

    if (hasAnswer && hasChoices && !nonEmptyChoices.includes(data.answer!.trim())) {
      ctx.addIssue({
        code: "custom",
        message: "La bonne réponse doit correspondre à un choix.",
        path: ["answer"],
      });
    }
  })

export type FormValues = z.infer<typeof formSchema>

export function CreateEnigmaForm({
  nextEnigmaNumber,
  mapReferenceMarkers,
  routePolyline,
}: {
  nextEnigmaNumber: number
  mapReferenceMarkers: LocationPickerContextMarker[]
  routePolyline: [number, number][] | null
}) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const caps = useAdminCapabilities()
  const canEdit = caps.adventure.update
  const [open, setOpen] = useState(false)
  const form = useForm<
    z.input<typeof formSchema>,
    unknown,
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
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
      adventureId: params?.id ?? "",
    }
  })
  const latitudeValue = useWatch({ control: form.control, name: "latitude" })
  const longitudeValue = useWatch({ control: form.control, name: "longitude" })

  const [choiceInputs, setChoiceInputs] = useState<string[]>(["", "", "", ""])

  const waypoints = useMemo(
    () =>
      buildAdventureRouteWaypointsLonLat(mapReferenceMarkers, {
        extraEnigma: {
          number: nextEnigmaNumber,
          latitude: Number(latitudeValue),
          longitude: Number(longitudeValue),
        },
      }),
    [
      latitudeValue,
      longitudeValue,
      mapReferenceMarkers,
      nextEnigmaNumber,
    ]
  )

  const baselineSerialized = useMemo(
    () =>
      JSON.stringify(
        buildAdventureRouteWaypointsLonLat(mapReferenceMarkers)
      ),
    [mapReferenceMarkers]
  )

  const adventureId = params?.id ?? ""
  const { liveRoute: liveRoutePreview, loading: routePreviewLoading } =
    useLiveAdventureRoutePreview(adventureId, waypoints, {
      baselineSerialized,
      enabled: canEdit && open,
    })

  const displayRoutePolyline =
    liveRoutePreview != null ? liveRoutePreview.polyline : routePolyline

  const syncChoices = (next: string[]) => {
    const currentAnswer = form.getValues("answer")
    const selectedIndex =
      typeof currentAnswer === "string" ? choiceInputs.findIndex((c) => c === currentAnswer) : -1

    // Si la valeur de la bonne réponse correspondait à un choix existant,
    // on met à jour le champ `answer` avec la nouvelle valeur du choix (ou on le vide si le choix disparaît).
    if (selectedIndex >= 0) {
      const updatedAnswer = next[selectedIndex] ?? ""
      form.setValue("answer", updatedAnswer, { shouldValidate: true, shouldDirty: true })
    } else if (typeof currentAnswer === "string" && currentAnswer.trim() !== "" && !next.includes(currentAnswer)) {
      form.setValue("answer", "", { shouldValidate: true, shouldDirty: true })
    }

    setChoiceInputs(next)
    form.setValue("choices", next, { shouldValidate: true, shouldDirty: true })
  }

  const onSubmit = useCallback(async (data: z.infer<typeof formSchema>) => {
    const plain = JSON.parse(JSON.stringify(data)) as z.infer<typeof formSchema>
    const result = await createEnigma({
      name: plain.name,
      question: plain.question,
      uniqueResponse: plain.uniqueResponse ?? false,
      answer: plain.answer ?? "",
      answerMessage: plain.answerMessage,
      description: plain.description,
      latitude: Number(plain.latitude),
      longitude: Number(plain.longitude),
      adventureId: plain.adventureId,
      choice: plain.choices.filter((c) => c !== ""),
    })
    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(result.message)
    setOpen(false)
    router.refresh()
  }, [router])

  const onInvalid: SubmitErrorHandler<z.input<typeof formSchema>> = useCallback(() => {
    toast.error("Vérifiez les champs du formulaire.")
  }, [])

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void form.handleSubmit(onSubmit, onInvalid)(event)
    },
    [form, onInvalid, onSubmit]
  )

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
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Création d&apos;énigme</DialogTitle>
          </DialogHeader>

          <FieldGroup className="space-y-4">
            <FieldSet>
              <FieldDescription>
                Formulaire de la création d&apos;énigme

              </FieldDescription>
              <div className="grid gap-3 md:grid-cols-2">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Nom d&apos;énigme
                      </FieldLabel>
                      <Input
                        className="w-100!"
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                        placeholder={"Ex. : nom de l'énigme"} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel>Numéro d&apos;ordre</FieldLabel>
                  <FieldDescription>
                    Cette énigme sera la n°{" "}
                    <span className="font-semibold text-foreground">{nextEnigmaNumber}</span> dans le
                    parcours (attribution automatique). Vous pourrez réorganiser l&apos;ordre après
                    création.
                  </FieldDescription>
                </Field>
                <Controller
                  name="question"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field className="md:col-span-2" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Question
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                        value={String(field.value ?? "")}
                        placeholder="Quel est un fruit rouge et rond?"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="answer"
                control={form.control}
                render={({ field, fieldState }) => {
                  const selectedIndex = choiceInputs.findIndex((c) => c === field.value)
                  const selectedRadioValue =
                    selectedIndex >= 0 ? String(selectedIndex) : "none"

                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Choix de la réponse</FieldLabel>

                      <RadioGroup
                        value={selectedRadioValue}
                        onValueChange={(v) => {
                          const idx = Number(v)
                          field.onChange(choiceInputs[idx] ?? "")
                        }}
                        className="mt-2"
                      >
                        <div className="space-y-2">
                          {choiceInputs.map((value, index) => {
                            const isEmpty = value.trim() === ""
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <RadioGroupItem
                                  value={String(index)}
                                  disabled={isEmpty}
                                  aria-label={`Réponse ${index + 1}`}
                                />

                                <Input
                                  value={value}
                                  className="flex-1"
                                  aria-label={`Choix ${index + 1}`}
                                  autoComplete="off"
                                  placeholder={`Choix ${index + 1}`}
                                  onChange={(e) => {
                                    const next = choiceInputs.map((c, i) =>
                                      i === index ? e.target.value : c
                                    )
                                    syncChoices(next)
                                  }}
                                />

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const next = choiceInputs.filter(
                                      (_, i) => i !== index
                                    )
                                    syncChoices(next.length > 0 ? next : [""])
                                  }}
                                  disabled={choiceInputs.length <= 1}
                                >
                                  Retirer
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      </RadioGroup>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}

                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => syncChoices([...choiceInputs, ""])}
                        >
                          Ajouter un choix
                        </Button>
                      </div>
                    </Field>
                  )
                }}
              />
            </FieldSet>

            <Controller
              name="answerMessage"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Message (après bonne réponse)</FieldLabel>
                  <AdventureDescriptionEditor
                    id={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!canEdit}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="latitude"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || Boolean(form.formState.errors.longitude)}>
                  <FieldLabel>Position sur la carte</FieldLabel>
                  <LocationPicker
                    latitude={Number(latitudeValue ?? 0)}
                    longitude={Number(longitudeValue ?? 0)}
                    onChange={({ latitude, longitude }) => {
                      form.setValue("latitude", latitude, { shouldDirty: true, shouldValidate: true })
                      form.setValue("longitude", longitude, { shouldDirty: true, shouldValidate: true })
                    }}
                    helperText={`Repères : D départ, numéros = énigmes, T = trésor ; trait bleu = itinéraire ORS. Placez la nouvelle énigme (grand marqueur bleu).${routePreviewLoading ? " Recalcul de l'itinéraire…" : ""
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
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  {form.formState.errors.longitude && (
                    <FieldError errors={[form.formState.errors.longitude]} />
                  )}
                </Field>
              )}
            />

            <FieldSet>
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
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  </FieldGroup>
                )}
              />
            </FieldSet>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit">Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}