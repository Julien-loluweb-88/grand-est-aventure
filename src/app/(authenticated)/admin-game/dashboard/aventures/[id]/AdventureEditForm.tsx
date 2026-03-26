"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
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
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { updateAdventure } from "./adventure.action"
import { Adventure } from "../../../../../../../generated/prisma/browser";

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
    .coerce.number().refine((v) => !isNaN(v), {
      message: "Latitude invalide",
    }),
  longitude: z
    .coerce.number().refine((v) => !isNaN(v), {
      message: "Longtitude invalide",
    }),
  distance: z.coerce.number({ error: "Distance invalide" }),
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
              <Input className="!w-100"
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
              <Input className="!w-40"
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
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Latitude</FieldLabel>
                <Input className="!w-50"
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  value={String(field.value ?? "")}
                  placeholder="12.3456"
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
                <FieldLabel htmlFor={field.name}>Longitude</FieldLabel>
                <Input className="!w-50"
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  value={String(field.value ?? "")}
                  placeholder="12.3456" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="distance"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Distance</FieldLabel>
                <Input className="!w-50"
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