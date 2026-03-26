"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller  } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { toast } from "sonner";
import { ChoiceInput} from "./Choice.enigma";
import { createEnigma } from "./enigma.action"
import { schema } from "better-auth/client/plugins"

const formSchema = z.object({
  name: z
  .string()
  .min(2, "Le nom doit être comporter au moins 2 caractères")
  .max(30, "Le nom doit être maximum 30 caractères"),
number: z
.coerce.number().refine((v) => ! isNaN(v), {
    message: "Numéro invalide",
  }),
question: z
.string()
  .min(20, "La question doit être comporter au moins 20 caractères")
  .max(250, "La question doit être maximum 250 caractères"),
uniqueResponse: z
.boolean().optional(),
choices: z
.array(z.string()).optional(),
answer: z
.string()
.optional(),
answerMessage: z
.string()
.min(5, "Le message doit être au moins 5 caractères")
.max(250, "Le message doit être maximum 250 caractères"),
description: z
.string()
.min(20, "Le description doit être comporter au moins 20 caractères")
.max(250, "Le description doit être maximum 250 caractères"),
adventureId: 
z.string(),
latitude: z
.coerce.number().refine((v) => ! isNaN(v), {
message: "Latitude invalide",
}),
longitude: z
.coerce.number().refine((v) => ! isNaN(v), {
message: "Longtitude invalide",
})
})  
.superRefine((data, ctx) => {
  const hasUnique = data.uniqueResponse === true; 
  const hasAnswer = data.answer && data.answer.trim() !== "";
  const hasChoices =
      data.choices &&
      data.choices.filter((c) => c.trim() !== "").length > 0;

    if (!hasUnique && !hasAnswer && !hasChoices) {
      ctx.addIssue({
        code: "custom",
        message:
          "Vous devez remplir uniqueResponse ou answer ou des choix",
        path: ["answer"], 
      });
    }  
})

export type FormValues = z.infer<typeof schema>
export function CreateEnigmaForm() {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(formSchema),
        defaultValues: {
          name: "",
          number: 0,
          question: "",
          uniqueResponse: false,
          choices: ["", "", "", ""],
          answer: "",
          description: "",
          latitude: 0,
          longitude: 0,
        }
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const result = await createEnigma({
    name: data.name,
    number: data.number,
    question: data.question,
    uniqueResponse: data.uniqueResponse ?? false,
    answer: data.answer ?? "",
    answerMessage: data.answerMessage,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    adventureId: data.adventureId,
    choice: data.choices?.filter((c) => c !== "") ?? [],
    })
  }
  
    return (
      <Dialog>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogTrigger asChild>
          <Button variant="outline">Créer une énigme</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
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
                  className="!w-100"
        {...field}
        id={field.name}
        aria-invalid={fieldState.invalid}
        autoComplete="off"
        placeholder="Toto"/>
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
        placeholder="1"/>
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
      name="uniqueResponse"
      control={form.control}
      render={({ field, fieldState }) => (
        <FieldGroup className="gap-3">
      <Field >
        <FieldLabel htmlFor={field.name}>
                Choix de la réponse
        </FieldLabel>
        <RadioGroup
          value={String(field.value)}
          onValueChange={(val) => field.onChange(val === "true")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="vrai" />
            <FieldLabel htmlFor="vrai" className="font-normal">
              Vrai
            </FieldLabel>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="faux" />
            <FieldLabel htmlFor="faux" className="font-normal">
              Faux
            </FieldLabel>
          </div>
        </RadioGroup>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
        </FieldGroup>
      )}
      />
          </FieldSet>
     
          <ChoiceInput
          register={form.register}
          errors={form.formState.errors}
           />
            
           <Field>
                <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                  Réponse
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-number-uw1"
                  placeholder="Pomme"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                  Message
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-number-uw1"
                  placeholder="Félicitation"
                  required
                />
              </Field>
               <Field>
                <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                  Latitude
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-number-uw1"
                  placeholder="12.3456"
                  required
                />
              </Field>
               <Field>
                <FieldLabel htmlFor="checkout-7j9-card-number-uw1">
                  Longtitude
                </FieldLabel>
                <Input
                  id="checkout-7j9-card-number-uw1"
                  placeholder="12.3456"
                  required
                />
              </Field>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="checkout-7j9-optional-comments">
                  Description
                </FieldLabel>
                <Textarea
                  id="checkout-7j9-optional-comments"
                  placeholder="Ajoutez d&apos;explication de cette énigme"
                  className="resize-none"
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
        <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit">Créer</Button>
          </DialogFooter>
        </DialogContent>
        </form>
        </Dialog>
    )
}