"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller  } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { createAdventure } from "../adventure.action"
import { toast } from "sonner";

const formSchema = z.object({
  name: z
  .string()
  .min(2, "Le nom doit être comporter au moins 2 caractères")
  .max(30, "Le nom doit être maximum 30 caractères"),
  description: z
  .string()
  .min(20, "Le description doit être comporter au moins 20 caractères")
  .max(250, "Le description doit être maximum 250 caractères"),
  city: z
  .string()
  .min(2, "le nom de la ville doit être comporter au moins 2 caractères")
  .max(50, "Le nom de la ville doit être maximum 50 caractères"),
  status: z
  .boolean(),
  latitude: z
  .coerce.number().refine((v) => ! isNaN(v), {
    message: "Latitude invalide",
  }),
  longitude: z
  .coerce.number().refine((v) => ! isNaN(v), {
    message: "Longtitude invalide",
  }),
  distance: z.coerce.number({ error: "Distance invalide" }),
})

export function CreateAdventureForm() {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
  description: "",
  city: "",
  latitude: 0,
  longitude: 0,
  distance: 0, 
    },
  })
 const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const result = await createAdventure(data)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Aventure créée.")
    form.reset()
    router.push("/admin-game/dashboard/aventures")
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
    <FieldGroup>
      <Controller
      name="name"
      control={form.control}
      render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={field.name}>Nom d&apos;aventure</FieldLabel>
        <Input
        className="!w-100"
        {...field}
        id={field.name}
        aria-invalid={fieldState.invalid}
        autoComplete="off"
        placeholder="Nouvelle aventure" />
        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
  )}
      />
      <Controller
      name="city"
      control={form.control}
      render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={field.name}>Ville</FieldLabel>
        <Input
        className="!w-100"
        {...field}
        id={field.name}
        aria-invalid={fieldState.invalid}
        autoComplete="off"
        placeholder="À quelle ville?" />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
      )}
      />
      <div className="flex gap-4">
      <Controller
      name="latitude"
      control={form.control}
      render={({ field, fieldState }) => (
      <Field className="flex-1" data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={field.name}>Latitude</FieldLabel>
        <Input
        {...field}
        id={field.name}
        aria-invalid={fieldState.invalid}
        autoComplete="off"
        type="number"
        value={String(field.value ?? "")}
        placeholder="12.34567" />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
      )}
      />
      <Controller
      name="longitude"
      control={form.control}
      render={({ field, fieldState }) => (
      <Field className="flex-1" data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={field.name}>Longitude</FieldLabel>
        <Input 
        {...field}
        id={field.name}
        aria-invalid={fieldState.invalid}
        autoComplete="off" 
        value={String(field.value ?? "")}
        placeholder="12.34567"
        />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
      )}
      />
      <Controller
      name="distance"
      control={form.control}
      render={({ field, fieldState }) => (
      <Field className="flex-1" data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={field.name}>Distance</FieldLabel>
        <Input 
        {...field}
        id={field.name}
        aria-invalid={fieldState.invalid}
        autoComplete="off"
        value={String(field.value ?? "")}
        placeholder="5km"/>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
      )}
      />
      </div>
      <Controller
      name="description"
      control={form.control}
      render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={field.name}>Description</FieldLabel>
        <Textarea
          {...field}
        id={field.name}
        aria-invalid={fieldState.invalid}
        autoComplete="off"
        placeholder="Explication d&apos;aventure"
        className="resize-none"/>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
      )}
      />
      <Field orientation="horizontal">
        <Button type="reset" variant="outline">
          Annuler
        </Button>
        <Button type="submit">Créer</Button>
      </Field>
    </FieldGroup> 
    </form>
  );
}
