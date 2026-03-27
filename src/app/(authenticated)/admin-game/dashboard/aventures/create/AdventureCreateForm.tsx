"use client"
import { useState, useCallback } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, useWatch } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { GuardedButton } from "@/components/admin/GuardedButton"
import { useAdminCapabilities } from "../../AdminCapabilitiesProvider"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { createAdventure } from "../adventure.action"
import { toast } from "sonner";
import { LocationPicker } from "@/components/location/LocationPicker";
import { AdventureDescriptionEditor } from "@/components/adventure/AdventureDescriptionEditor";
import { EMPTY_TIPTAP_DOCUMENT } from "@/lib/adventure-description-tiptap";
import { adventureDescriptionCreateZod } from "@/lib/adventure-description-schema";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(30, "Le nom ne doit pas dépasser 30 caractères"),
  description: adventureDescriptionCreateZod,
  city: z
    .string()
    .min(2, "Le nom de la ville doit contenir au moins 2 caractères")
    .max(50, "Le nom de la ville ne doit pas dépasser 50 caractères"),
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
})

export type CreateAdventureAssignableAdmin = {
  id: string
  name: string | null
  email: string
}

export function CreateAdventureForm({
  assignableAdmins = [],
}: {
  assignableAdmins?: CreateAdventureAssignableAdmin[]
}) {
  const router = useRouter()
  const caps = useAdminCapabilities()
  const [assignedAdminIds, setAssignedAdminIds] = useState<Set<string>>(
    () => new Set()
  )

  const toggleAssignableAdmin = useCallback((userId: string, checked: boolean) => {
    setAssignedAdminIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(userId)
      } else {
        next.delete(userId)
      }
      return next
    })
  }, [])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: EMPTY_TIPTAP_DOCUMENT,
      city: "",
      latitude: 48.4072318295932,
      longitude: 6.843844487240165,
    },
  })
  const latitudeValue = useWatch({ control: form.control, name: "latitude" })
  const longitudeValue = useWatch({ control: form.control, name: "longitude" })
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const result = await createAdventure(data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Aventure créée.")
      router.push("/admin-game/dashboard/aventures/" + result.id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la création."
      toast.error(msg)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, () => {
        toast.error("Vérifie les champs du formulaire.");
      })}
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nom d&apos;aventure</FieldLabel>
              <Input
                className="w-100!"
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
                className="w-100!"
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
                placeholder="À quelle ville?" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="flex flex-col gap-4">
          <Controller
            name="latitude"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className="w-full" data-invalid={fieldState.invalid || Boolean(form.formState.errors.longitude)}>
                <FieldLabel>Position sur la carte</FieldLabel>
                <LocationPicker
                  latitude={Number(latitudeValue ?? 0)}
                  longitude={Number(longitudeValue ?? 0)}
                  onChange={({ latitude, longitude }) => {
                    form.setValue("latitude", latitude, { shouldDirty: true, shouldValidate: true })
                    form.setValue("longitude", longitude, { shouldDirty: true, shouldValidate: true })
                  }}
                  helperText="Cliquez sur la carte pour placer l'aventure."
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input
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
          <p className="text-sm text-muted-foreground">
            La distance totale du parcours (départ, puis énigmes, puis trésor) est calculée
            automatiquement côté serveur via OpenRouteService dès qu’il y a au moins deux points
            et qu’une clé <code className="rounded bg-muted px-1 py-0.5 text-xs">OPENROUTESERVICE_API_KEY</code>{" "}
            est configurée.
          </p>
        </div>
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <AdventureDescriptionEditor
                id={field.name}
                value={field.value}
                onChange={field.onChange}
                disabled={!caps.adventure.create}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {caps.canAssignRolesAndScopes && assignableAdmins.length > 0 ? (
          <Field>
            <FieldLabel>Admins sur cette aventure (optionnel)</FieldLabel>
            <p className="mb-2 text-sm text-muted-foreground">
              Même principe que sur la fiche aventure : comptes rôle « admin » qui
              pourront gérer le contenu.{" "}
              <Link
                href="/admin-game/dashboard/utilisateurs"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                Utilisateurs
              </Link>
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input p-3">
              {assignableAdmins.map((admin) => (
                <label
                  key={admin.id}
                  className="flex cursor-pointer items-center gap-3 text-sm"
                >
                  <Checkbox
                    checked={assignedAdminIds.has(admin.id)}
                    onCheckedChange={(checked) =>
                      toggleAssignableAdmin(admin.id, checked === true)
                    }
                  />
                  <span>
                    <span className="font-medium">{admin.name ?? admin.email}</span>
                    {admin.name ? (
                      <span className="text-muted-foreground">
                        {" "}
                        — {admin.email}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </Field>
        ) : null}
        <Field orientation="horizontal">
          <Button type="reset" variant="outline">
            Annuler
          </Button>
          <GuardedButton
            type="submit"
            allowed={caps.adventure.create}
            denyReason="Vous ne pouvez pas créer une aventure."
          >
            Créer
          </GuardedButton>
        </Field>
      </FieldGroup>
    </form>
  );
}
