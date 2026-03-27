"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, useWatch } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { updateAdventure } from "./adventure.action"
import { Adventure } from "../../../../../../../generated/prisma/browser";
import { LocationPicker } from "@/components/location/LocationPicker";

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
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  distance: z.coerce.number({ error: "Distance invalide" }).positive("Distance invalide"),
})

export function AdventureEditForm({ adventure }: { adventure: Adventure }) {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: adventure.name,
      city: adventure.city,
      latitude: adventure.latitude,
      longitude: adventure.longitude,
      distance: adventure.distance,
      description: adventure.description?.toString() ?? "",
    },
  })
  const latitudeValue = useWatch({ control: form.control, name: "latitude" })
  const longitudeValue = useWatch({ control: form.control, name: "longitude" })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const result = await updateAdventure(adventure.id, data)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Aventure mise à jour.")
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
              <Input className="w-100!"
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
              <Input className="w-40!"
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
                placeholder="Paris" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="flex gap-4">
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
                  helperText="Cliquez sur la carte pour déplacer le point de l'aventure."
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input
                    className="w-full!"
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    type="number"
                    step="any"
                    value={String(field.value ?? "")}
                    placeholder="Latitude"
                  />
                  <Input
                    className="w-full!"
                    name="longitude"
                    aria-invalid={Boolean(form.formState.errors.longitude)}
                    autoComplete="off"
                    type="number"
                    step="any"
                    value={String(longitudeValue ?? "")}
                    placeholder="Longitude"
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
          <Controller
            name="distance"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Distance</FieldLabel>
                <Input className="w-50!"
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  value={String(field.value ?? "")}
                  placeholder="5" />
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
                className="resize-none" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field orientation="horizontal">
          <Button type="submit" >Modifier</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}