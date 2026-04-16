"use client"
import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, useWatch, type FieldErrors } from "react-hook-form"
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
import { toast } from "sonner";
import { LocationPicker } from "@/components/location/LocationPicker";
import { AdventureDescriptionEditor } from "@/components/adventure/AdventureDescriptionEditor";
import { EMPTY_TIPTAP_DOCUMENT } from "@/lib/adventure-description-tiptap";
import { adventureDescriptionCreateZod } from "@/lib/adventure-description-schema";
import type { CitySelectOption } from "@/lib/city-types";
import { createAdventure } from "@/lib/actions/create-adventure";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(30, "Le nom ne doit pas dépasser 30 caractères"),
  description: adventureDescriptionCreateZod,
  cityId: z.string().min(1, "Choisissez une ville dans la liste."),
  latitude: z
    .coerce.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .coerce.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  coverImageUrl: z.string().max(2048).optional().default(""),
  badgeImageUrl: z.string().max(2048).optional().default(""),
  /** Exemplaires physiques numérotés dans le trésor (0 = pas de stock suivi). */
  physicalBadgeStockCount: z.coerce.number().int().min(0).max(100_000).default(0),
  audience: z.enum(["PUBLIC", "DEMO"]),
})

export type CreateAdventureAssignableAdmin = {
  id: string
  name: string | null
  email: string
}

type CreateAdventurePayload = Omit<
  z.infer<typeof formSchema>,
  "coverImageUrl" | "badgeImageUrl"
> & {
  coverImageUrl: string | null
  badgeImageUrl: string | null
  physicalBadgeStockCount: number
  descriptionDraftId: string
  assignedAdminIds?: string[]
}

type FormValues = z.infer<typeof formSchema>

const FORM_FIELD_ORDER: (keyof FormValues)[] = [
  "name",
  "cityId",
  "latitude",
  "longitude",
  "coverImageUrl",
  "badgeImageUrl",
  "physicalBadgeStockCount",
  "description",
]

function scrollToFirstInvalidField(errors: FieldErrors<FormValues>) {
  for (const key of FORM_FIELD_ORDER) {
    if (!errors[key]) continue
    const el = document.getElementById(String(key))
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus({ preventScroll: true })
    }
    break
  }
}

export function CreateAdventureForm({
  assignableAdmins = [],
  cities,
}: {
  assignableAdmins?: CreateAdventureAssignableAdmin[];
  cities: CitySelectOption[];
}) {
  const router = useRouter()
  const caps = useAdminCapabilities()
  const descriptionDraftIdRef = useRef(crypto.randomUUID())
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
      cityId: "",
      latitude: 48.4072318295932,
      longitude: 6.843844487240165,
      coverImageUrl: "",
      badgeImageUrl: "",
      physicalBadgeStockCount: 0,
      audience: "PUBLIC",
    },
  })
  const latitudeValue = useWatch({ control: form.control, name: "latitude" })
  const longitudeValue = useWatch({ control: form.control, name: "longitude" })
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const payload: CreateAdventurePayload = {
        ...data,
        description: JSON.parse(JSON.stringify(data.description)),
        coverImageUrl: data.coverImageUrl?.trim() || null,
        badgeImageUrl: data.badgeImageUrl?.trim() || null,
        physicalBadgeStockCount: data.physicalBadgeStockCount,
        descriptionDraftId: descriptionDraftIdRef.current,
        assignedAdminIds:
          assignedAdminIds.size > 0 ? [...assignedAdminIds] : undefined,
      }
      const result = await createAdventure(payload)
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
      onSubmit={form.handleSubmit(onSubmit, (errs) => {
        scrollToFirstInvalidField(errs as FieldErrors<FormValues>)
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
          name="cityId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Ville</FieldLabel>
              <p className="mb-1 text-xs text-muted-foreground">
                Les villes sont gérées à part.{" "}
                <Link
                  href="/admin-game/dashboard/villes"
                  className="text-foreground underline underline-offset-2 hover:text-primary"
                >
                  Gérer les villes
                </Link>
              </p>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={cities.length === 0}
              >
                <SelectTrigger
                  id={field.name}
                  className="w-full max-w-md"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder={cities.length === 0 ? "Aucune ville — créez-en une" : "Choisir une ville"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="audience"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Visibilité</FieldLabel>
              <p className="mb-1 text-xs text-muted-foreground">
                « Démo » : l’aventure n’apparaît pas dans le catalogue public ; vous pourrez inviter
                des comptes depuis la fiche aventure.
              </p>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={field.name}
                  className="w-full max-w-md"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Publique</SelectItem>
                  <SelectItem value="DEMO">Démo (restreinte)</SelectItem>
                </SelectContent>
              </Select>
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
                  editableMarkerKind="departure"
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
                    id="longitude"
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
          name="coverImageUrl"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Image de présentation (optionnel)</FieldLabel>
              <p className="mb-1 text-xs text-muted-foreground">
                URL complète ou chemin ; pour téléverser un fichier, ouvrez l’aventure après création.
              </p>
              <Input
                {...field}
                id={field.name}
                autoComplete="off"
                placeholder="https://… ou /uploads/…"
                className="font-mono text-xs"
              />
            </Field>
          )}
        />
        <Controller
          name="badgeImageUrl"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Image du badge (optionnel)</FieldLabel>
              <p className="mb-1 text-xs text-muted-foreground">
                Visuel du badge virtuel (collection appli) ; même fichier que le trésor physique si
                vous le souhaitez — téléversement sur la fiche après création.
              </p>
              <Input
                {...field}
                id={field.name}
                autoComplete="off"
                placeholder="https://… ou /uploads/…"
                className="font-mono text-xs"
              />
            </Field>
          )}
        />
        <Controller
          name="physicalBadgeStockCount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Stock de badges physiques</FieldLabel>
              <p className="mb-1 text-xs text-muted-foreground">
                Nombre d’exemplaires numérotés dans le trésor (0 = aucun suivi de stock).
              </p>
              <Input
                {...field}
                id={field.name}
                type="number"
                min={0}
                step={1}
                value={field.value === undefined || field.value === null ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value === "" ? 0 : Number(e.target.value);
                  field.onChange(Number.isNaN(v) ? 0 : v);
                }}
                className="max-w-xs"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
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
                richTextImageUploadDraftId={descriptionDraftIdRef.current}
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
