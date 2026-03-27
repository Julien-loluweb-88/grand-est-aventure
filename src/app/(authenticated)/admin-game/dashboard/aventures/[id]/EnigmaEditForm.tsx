"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, useWatch } from "react-hook-form"
import * as z from "zod"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateEnigma } from "./enigma.action"
import { LocationPicker } from "@/components/location/LocationPicker";


const formSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit être comporter au moins 2 caractères")
    .max(30, "Le nom doit être maximum 30 caractères"),
  number: z
    .coerce.number().refine((v) => !isNaN(v), {
      message: "Numéro invalide",
    }),
  question: z
    .string()
    .min(10, "La question doit comporter au moins 10 caractères")
    .max(250, "La question doit être maximum 250 caractères"),
  uniqueResponse: z
    .boolean().optional(),
  choices: z
    .array(z.string()),
  answer: z
    .string()
    .optional(),
  answerMessage: z
    .string()
    .min(3, "Le message doit être au moins 3 caractères")
    .max(250, "Le message doit être maximum 250 caractères"),
  description: z
    .string()
    .min(20, "Le description doit être comporter au moins 20 caractères")
    .max(250, "Le description doit être maximum 250 caractères"),
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
type EnigmaFormValuesWithId = FormValues & { id: string }

export function EditenigmaForm({ enigma }: { enigma: EnigmaFormValuesWithId }) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const defaultChoices = enigma.choices?.length ? enigma.choices : ["", "", "", ""]

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: enigma.name,
      number: enigma.number,
      question: enigma.question,
      uniqueResponse: enigma.uniqueResponse ?? false,
      choices: defaultChoices,
      answer: enigma.answer,
      answerMessage: enigma.answerMessage,
      description: enigma.description?.toString() ?? "",
      latitude: enigma.latitude,
      longitude: enigma.longitude,
      adventureId: params?.id ?? "",
    }
  })
  const latitudeValue = useWatch({ control: form.control, name: "latitude" })
  const longitudeValue = useWatch({ control: form.control, name: "longitude" })
  const [choiceInputs, setChoiceInputs] = useState<string[]>(defaultChoices)

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

  const adventureId = params?.id ?? "";

  const onSubmit = async (data: z.input<typeof formSchema>) => {
    const result = await (
      updateEnigma(enigma.id, {
        name: data.name,
        number: Number(data.number),
        question: data.question,
        uniqueResponse: data.uniqueResponse ?? false,
        answer: data.answer ?? "",
        answerMessage: data.answerMessage,
        description: data.description,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        adventureId: data.adventureId,
        choice: data.choices.filter((c) => c !== ""),
      }))

    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Énigme mise à jour")
    router.refresh()
    router.push(`/admin-game/dashboard/aventures/${adventureId}`)
  }

  return (
    <Dialog>
      
        <DialogTrigger asChild>
          <Button variant="outline">Modifier</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;énigme</DialogTitle>
            <DialogDescription>
              Modifier l&apos;énigme ${enigma.name}
            </DialogDescription>
          </DialogHeader>
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
          <Controller
            name="number"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Numéro
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  value={String(field.value ?? "")}
                  placeholder="1" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="question"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
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
                <FieldLabel>Message</FieldLabel>
                <Input
                  {...field}
                  placeholder="Félicitation"
                  autoComplete="off"
                  value={String(field.value ?? "")}
                  onChange={(e) => field.onChange(e.target.value)}
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
                  helperText="Déplacez le point de l'énigme sur la carte."
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
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      {...field}
                      placeholder="Ajoutez description de cette énigme"
                      className="resize-none"
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
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