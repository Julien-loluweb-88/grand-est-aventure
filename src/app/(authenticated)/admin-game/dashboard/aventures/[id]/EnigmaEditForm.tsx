"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, useWatch } from "react-hook-form"
import * as z from "zod"
import { useState, useEffect, useMemo } from "react"
import { buildAdventureRouteWaypointsLonLat } from "@/lib/adventure-route-waypoints"
import { useLiveAdventureRoutePreview } from "@/hooks/use-live-adventure-route-preview"
import { Button } from "@/components/ui/button"
import { GuardedButton } from "@/components/admin/GuardedButton"
import { useAdminCapabilities } from "../../AdminCapabilitiesProvider"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateEnigma } from "./enigma.action"
import { LocationPicker } from "@/components/location/LocationPicker"
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types"
import { AdventureDescriptionEditor } from "@/components/adventure/AdventureDescriptionEditor";
import { adventureDescriptionToTiptapJSON } from "@/lib/adventure-description-tiptap";
import {
  adventureDescriptionEditZod,
  enigmaAnswerMessageEditZod,
} from "@/lib/adventure-description-schema";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(30, "Le nom ne doit pas dépasser 30 caractères"),
  number: z
    .coerce.number().refine((v) => !isNaN(v), {
      message: "Numéro invalide",
    }),
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
  answerMessage: enigmaAnswerMessageEditZod,
  description: adventureDescriptionEditZod,
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

/** Ligne liste admin : champs Json sérialisés tels que renvoyés par Prisma. */
export type EnigmaEditRow = {
  id: string
  name: string
  number: number
  question: string
  uniqueResponse: boolean
  choices: string[]
  answer: string
  answerMessage: unknown
  description: unknown
  latitude: number
  longitude: number
  adventureId: string
}

export function EditenigmaForm({
  enigma,
  mapReferenceMarkers,
  routePolyline,
}: {
  enigma: EnigmaEditRow
  mapReferenceMarkers: LocationPickerContextMarker[]
  routePolyline: [number, number][] | null
}) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const caps = useAdminCapabilities()
  const [open, setOpen] = useState(false)
  const defaultChoices = enigma.choices?.length ? enigma.choices : ["", "", "", ""]

  const form = useForm<
    z.input<typeof formSchema>,
    unknown,
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
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
  })
  const latitudeValue = useWatch({ control: form.control, name: "latitude" })
  const longitudeValue = useWatch({ control: form.control, name: "longitude" })
  const numberValue = useWatch({ control: form.control, name: "number" })
  const [choiceInputs, setChoiceInputs] = useState<string[]>(defaultChoices)

  const pickerContextMarkers = useMemo(
    () =>
      mapReferenceMarkers.filter(
        (m) => m.kind !== "enigma" || m.id !== enigma.id
      ),
    [mapReferenceMarkers, enigma.id]
  )

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
  )

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
    [
      enigma.id,
      enigma.latitude,
      enigma.longitude,
      enigma.number,
      mapReferenceMarkers,
    ]
  )

  const { liveRoute: liveRoutePreview, loading: routePreviewLoading } =
    useLiveAdventureRoutePreview(enigma.adventureId, waypoints, {
      baselineSerialized: baselineWaypointsSerialized,
      enabled: caps.adventure.update && open,
    })

  const displayRoutePolyline =
    liveRoutePreview != null ? liveRoutePreview.polyline : routePolyline

  useEffect(() => {
    form.setValue("choices", choiceInputs, { shouldValidate: true })
  }, [choiceInputs, form])

  const syncChoices = (next: string[]) => {
    const currentAnswer = form.getValues("answer")
    setChoiceInputs(next)

    if (typeof currentAnswer !== "string" || currentAnswer.trim() === "") return

    const selectedIndex = choiceInputs.findIndex((c) => c === currentAnswer)
    if (selectedIndex === -1) return

    const nextAnswer = next[selectedIndex]
    form.setValue("answer", nextAnswer ?? "", { shouldValidate: true })
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const plain = JSON.parse(JSON.stringify(data)) as z.infer<typeof formSchema>
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
    })

    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Énigme mise à jour")
    setOpen(false)
    router.refresh()
  }

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
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;énigme</DialogTitle>
            <DialogDescription>
              Modifier l&apos;énigme « {enigma.name} »
            </DialogDescription>
          </DialogHeader>
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
                    placeholder="Toto" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Field>
              <FieldLabel>Ordre dans le parcours</FieldLabel>
              <p className="text-sm text-muted-foreground">
                Énigme n°{" "}
                <span className="font-medium text-foreground">{enigma.number}</span>. Pour changer la
                suite du parcours, utilisez le bloc <strong>Ordre des énigmes</strong> sous la liste.
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
                  disabled={!caps.adventure.update}
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
                  helperText={`Repères : D départ, autres énigmes, T trésor ; itinéraire bleu. Déplacez ce point (grand marqueur).${
                    routePreviewLoading ? " Recalcul de l'itinéraire…" : ""
                  }`}
                  contextMarkers={pickerContextMarkers}
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
                      disabled={!caps.adventure.update}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                </FieldGroup>
              )}
            />
          </FieldSet>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit">Modifier</Button>
          </DialogFooter>
        </form>
      </DialogContent>

    </Dialog>
  )
}