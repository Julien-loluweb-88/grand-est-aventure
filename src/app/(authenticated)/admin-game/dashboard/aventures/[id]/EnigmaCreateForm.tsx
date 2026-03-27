"use client"

import { useCallback, useState, type FormEvent } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, type SubmitErrorHandler } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner";
import { createEnigma } from "./enigma.action"


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
    .coerce.number().refine((v) => !isNaN(v), {
      message: "Latitude invalide",
    }),
  longitude: z
    .coerce.number().refine((v) => !isNaN(v), {
      message: "Longtitude invalide",
    })
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
export function CreateEnigmaForm() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [open, setOpen] = useState(false)
  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      number: 0,
      question: "",
      uniqueResponse: false,
      choices: ["", "", "", ""],
      answer: "",
      answerMessage: "",
      description: "",
      latitude: 0,
      longitude: 0,
      adventureId: params?.id ?? "",
    }
  })

  const [choiceInputs, setChoiceInputs] = useState<string[]>(["", "", "", ""])

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

  const onSubmit = useCallback(async (data: z.input<typeof formSchema>) => {

    const result = await createEnigma({
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
    })
    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(result.message)
    setOpen(false)
    router.refresh()
  }, [router])

  const onInvalid: SubmitErrorHandler<z.input<typeof formSchema>> = useCallback(
    (errors) => {
      console.warn("Form validation errors:", errors)
      toast.error("Vérifie les champs du formulaire.")
    },
    []
  )

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void form.handleSubmit(onSubmit, onInvalid)(event)
    },
    [form, onInvalid, onSubmit]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Créer une énigme</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>Création d&apos;énigme</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <FieldSet>
              <FieldLegend>Créer une énigme</FieldLegend>
              <FieldDescription>
                Création d&apos;énigme
              </FieldDescription>
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
            </FieldSet>

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
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Latitude</FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    placeholder="12.3456"
                    autoComplete="off"
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="longitude"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Longtitude</FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    placeholder="12.3456"
                    autoComplete="off"
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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