"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../AdminCapabilitiesProvider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CitySelectOption } from "@/lib/city-types";
import { DashboardImageUploadField } from "@/components/uploads/DashboardImageUploadField";
import { EditorialRewriteControl } from "@/components/admin/EditorialRewriteControl";
import {
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  type AdvertisementFormInput,
} from "../advertisement.action";
import { LocationPicker } from "@/components/location/LocationPicker";

const DEFAULT_MAP_LAT = 48.4072318295932;
const DEFAULT_MAP_LNG = 6.843844487240165;

function parseCoord(s: string | undefined): number {
  const t = String(s ?? "").trim().replace(",", ".");
  if (!t) return NaN;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

const advertiserKindSchema = z.enum([
  "SHOP",
  "ASSOCIATION",
  "MAIRIE",
  "OTHER",
]);

const schema = z.object({
  name: z.string().min(1, "Libellé interne requis.").max(200),
  advertiserKind: advertiserKindSchema,
  advertiserName: z.string().min(1, "Nom partenaire requis.").max(200),
  title: z.string().max(500).optional().default(""),
  body: z.string().max(10000).optional().default(""),
  imageUrl: z.string().max(2048).optional().default(""),
  targetUrl: z.string().max(2048).optional().default(""),
  placement: z.string().min(1, "Placement requis.").max(64),
  active: z.boolean(),
  startsAt: z.string().optional().default(""),
  endsAt: z.string().optional().default(""),
  sortOrder: z.coerce.number().int().min(0).max(999999),
  targetCenterLatitude: z.string().max(32).optional().default(""),
  targetCenterLongitude: z.string().max(32).optional().default(""),
  targetRadiusMeters: z.string().max(16).optional().default(""),
  partnerBadgeTitle: z.string().max(200).optional().default(""),
  partnerBadgeImageUrl: z.string().max(2048).optional().default(""),
  partnerMaxRedemptionsPerUser: z.coerce.number().int().min(1).max(100),
  partnerClaimsOpen: z.boolean(),
});

export type AdvertisementFormDefaultValues = Partial<z.infer<typeof schema>> & {
  targetCityIds?: string[];
  merchantUserIds?: string[];
};

function toFormInput(
  values: z.infer<typeof schema>,
  cityIds: string[],
  merchantIds: string[],
  mode: "create" | "edit",
  advertisementImageDraftId: string | null
): AdvertisementFormInput {
  return {
    name: values.name,
    advertiserKind: values.advertiserKind,
    advertiserName: values.advertiserName,
    title: values.title ?? "",
    body: values.body ?? "",
    imageUrl: values.imageUrl ?? "",
    targetUrl: values.targetUrl ?? "",
    placement: values.placement,
    active: values.active,
    startsAt: values.startsAt?.trim() ? values.startsAt : null,
    endsAt: values.endsAt?.trim() ? values.endsAt : null,
    sortOrder: values.sortOrder,
    targetCenterLatitude: values.targetCenterLatitude ?? "",
    targetCenterLongitude: values.targetCenterLongitude ?? "",
    targetRadiusMeters: values.targetRadiusMeters ?? "",
    targetCityIds: cityIds,
    partnerBadgeTitle: values.partnerBadgeTitle ?? "",
    partnerBadgeImageUrl: values.partnerBadgeImageUrl ?? "",
    partnerMaxRedemptionsPerUser: values.partnerMaxRedemptionsPerUser,
    partnerClaimsOpen: values.partnerClaimsOpen,
    merchantUserIds: merchantIds,
    advertisementImageDraftId:
      mode === "create" ? advertisementImageDraftId : undefined,
  };
}

export type MerchantSelectOption = {
  id: string;
  email: string;
  name: string | null;
};

export function AdvertisementForm({
  mode,
  advertisementId,
  cities,
  merchantOptions = [],
  defaultValues = {},
}: {
  mode: "create" | "edit";
  advertisementId?: string;
  cities: CitySelectOption[];
  merchantOptions?: MerchantSelectOption[];
  defaultValues?: AdvertisementFormDefaultValues;
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const advertisementImageDraftIdRef = useRef(crypto.randomUUID());
  const initialCityIds = useMemo(
    () => new Set(defaultValues.targetCityIds ?? []),
    [defaultValues.targetCityIds]
  );
  const initialMerchantIds = useMemo(
    () => new Set(defaultValues.merchantUserIds ?? []),
    [defaultValues.merchantUserIds]
  );
  const [targetCityIds, setTargetCityIds] = useState<Set<string>>(initialCityIds);
  const [merchantUserIds, setMerchantUserIds] = useState<Set<string>>(initialMerchantIds);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues.name ?? "",
      advertiserKind: defaultValues.advertiserKind ?? "SHOP",
      advertiserName: defaultValues.advertiserName ?? "",
      title: defaultValues.title ?? "",
      body: defaultValues.body ?? "",
      imageUrl: defaultValues.imageUrl ?? "",
      targetUrl: defaultValues.targetUrl ?? "",
      placement: defaultValues.placement ?? "home",
      active: defaultValues.active ?? true,
      startsAt: defaultValues.startsAt ?? "",
      endsAt: defaultValues.endsAt ?? "",
      sortOrder: defaultValues.sortOrder ?? 0,
      targetCenterLatitude: defaultValues.targetCenterLatitude ?? "",
      targetCenterLongitude: defaultValues.targetCenterLongitude ?? "",
      targetRadiusMeters: defaultValues.targetRadiusMeters ?? "",
      partnerBadgeTitle: defaultValues.partnerBadgeTitle ?? "",
      partnerBadgeImageUrl: defaultValues.partnerBadgeImageUrl ?? "",
      partnerMaxRedemptionsPerUser: defaultValues.partnerMaxRedemptionsPerUser ?? 1,
      partnerClaimsOpen: defaultValues.partnerClaimsOpen ?? true,
    },
  });

  const latStr = useWatch({ control: form.control, name: "targetCenterLatitude" });
  const lngStr = useWatch({ control: form.control, name: "targetCenterLongitude" });
  const radStr = useWatch({ control: form.control, name: "targetRadiusMeters" });

  const latNum = parseCoord(latStr);
  const lngNum = parseCoord(lngStr);
  const radTrim = String(radStr ?? "").trim();
  const radParsed = parseInt(radTrim, 10);
  const hasGeoCenter =
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180;
  const circleRadius =
    Number.isFinite(radParsed) && radParsed > 0 ? radParsed : null;
  const mapPickerLat = hasGeoCenter ? latNum : DEFAULT_MAP_LAT;
  const mapPickerLng = hasGeoCenter ? lngNum : DEFAULT_MAP_LNG;
  const geoRadiusSliderValue =
    Number.isFinite(radParsed) && radParsed > 0 ? radParsed : 3000;

  const handleGeoTargetChange = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      form.setValue("targetCenterLatitude", String(coords.latitude), {
        shouldDirty: true,
      });
      form.setValue("targetCenterLongitude", String(coords.longitude), {
        shouldDirty: true,
      });
      const currentR = String(form.getValues("targetRadiusMeters") ?? "").trim();
      if (!currentR) {
        form.setValue("targetRadiusMeters", "3000", { shouldDirty: true });
      }
    },
    [form]
  );

  const toggleCity = useCallback((cityId: string, checked: boolean) => {
    setTargetCityIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(cityId);
      else next.delete(cityId);
      return next;
    });
  }, []);

  const toggleMerchant = useCallback((userId: string, checked: boolean) => {
    setMerchantUserIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const cityIds = [...targetCityIds];
    const mIds = [...merchantUserIds];
    const payload = toFormInput(
      values,
      cityIds,
      mIds,
      mode,
      mode === "create" ? advertisementImageDraftIdRef.current : null
    );

    if (mode === "create") {
      const res = await createAdvertisement(payload);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Publicité créée.");
      router.push(`/admin-game/dashboard/publicites/${res.id}`);
      return;
    }

    if (!advertisementId) return;
    const res = await updateAdvertisement(advertisementId, payload);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Publicité mise à jour.");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!advertisementId) return;
    if (!confirm("Supprimer cette publicité et ses statistiques d’événements ?")) return;
    const res = await deleteAdvertisement(advertisementId);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Publicité supprimée.");
    router.push("/admin-game/dashboard/publicites");
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="ad-name">Libellé interne</FieldLabel>
              <Input id="ad-name" {...field} autoComplete="off" />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="advertiserKind"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Type d’annonceur</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHOP">Commerce</SelectItem>
                    <SelectItem value="ASSOCIATION">Association</SelectItem>
                    <SelectItem value="MAIRIE">Mairie</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="advertiserName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ad-advertiser-name">Nom du partenaire</FieldLabel>
                <Input id="ad-advertiser-name" {...field} autoComplete="off" />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </div>

        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FieldLabel htmlFor="ad-title">Titre (affichage)</FieldLabel>
                {caps.adventure.update ? (
                  <EditorialRewriteControl
                    scope={{ type: "city-editorial" }}
                    getSourceText={() => String(field.value ?? "")}
                    onApply={(t) => field.onChange(t)}
                    disabled={!caps.adventure.update}
                    dialogTitle="Reformuler le titre"
                  />
                ) : null}
              </div>
              <Input id="ad-title" {...field} autoComplete="off" />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="body"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FieldLabel htmlFor="ad-body">Texte</FieldLabel>
                {caps.adventure.update ? (
                  <EditorialRewriteControl
                    scope={{ type: "city-editorial" }}
                    getSourceText={() => String(field.value ?? "")}
                    onApply={(t) => field.onChange(t)}
                    disabled={!caps.adventure.update}
                    dialogTitle="Reformuler le texte"
                  />
                ) : null}
              </div>
              <Textarea id="ad-body" {...field} rows={4} className="min-h-24" />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="imageUrl"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <DashboardImageUploadField
                  scope={
                    mode === "edit" && advertisementId
                      ? "advertisement"
                      : "advertisement-draft"
                  }
                  advertisementId={
                    mode === "edit" && advertisementId ? advertisementId : undefined
                  }
                  advertisementDraftId={
                    mode === "create" ? advertisementImageDraftIdRef.current : undefined
                  }
                  label="Image"
                  description={
                    mode === "create"
                      ? "Téléversement vers uploads/advertisements/drafts/… puis déplacement à l’enregistrement."
                      : `Fichiers sous uploads/advertisements/${advertisementId ?? "…"}/. Saisie URL possible.`
                  }
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={!caps.adventure.update}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="targetUrl"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ad-target">Lien cible (clic)</FieldLabel>
                <Input
                  id="ad-target"
                  {...field}
                  autoComplete="off"
                  className="font-mono text-xs"
                  placeholder="https://…"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="placement"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ad-placement">Placement (code appli)</FieldLabel>
                <p className="mb-1 text-xs text-muted-foreground">
                  Ex. <code className="rounded bg-muted px-1">home</code>,{" "}
                  <code className="rounded bg-muted px-1">library</code> — aligné avec les appels API.
                </p>
                <Input id="ad-placement" {...field} autoComplete="off" />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="sortOrder"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ad-sort">Ordre</FieldLabel>
                <Input
                  id="ad-sort"
                  type="number"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                  value={String(field.value ?? 0)}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="startsAt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ad-start">Début (optionnel)</FieldLabel>
                <Input id="ad-start" type="datetime-local" {...field} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="endsAt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ad-end">Fin (optionnel)</FieldLabel>
                <Input id="ad-end" type="datetime-local" {...field} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </div>

        <Controller
          name="active"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal" className="items-center gap-2">
              <Checkbox
                id="ad-active"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
              />
              <FieldLabel htmlFor="ad-active" className="font-normal">
                Campagne active
              </FieldLabel>
            </Field>
          )}
        />

        <Field>
          <FieldLabel>Offre partenaire & badge</FieldLabel>
          <p className="mb-3 text-xs text-muted-foreground">
            Renseignez un titre de badge pour activer l’offre : les joueurs pourront demander une
            validation, les comptes commerçant cochés ci‑dessous pourront approuver. Vous pouvez
            définir une{" "}
            <span className="font-medium text-foreground">image dédiée</span> pour le badge (sinon
            l’image de la campagne, ci‑dessus, est réutilisée). Fermer les demandes ne
            retire pas les badges déjà obtenus.
          </p>
          <div className="space-y-4 rounded-md border border-input p-4">
            <Controller
              name="partnerBadgeTitle"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ad-partner-badge-title">
                    Titre du badge (offre partenaire)
                  </FieldLabel>
                  <Input
                    id="ad-partner-badge-title"
                    {...field}
                    placeholder="Ex. Fidèle chez …"
                    autoComplete="off"
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="partnerBadgeImageUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <DashboardImageUploadField
                    scope={
                      mode === "edit" && advertisementId
                        ? "advertisement"
                        : "advertisement-draft"
                    }
                    advertisementId={
                      mode === "edit" && advertisementId ? advertisementId : undefined
                    }
                    advertisementDraftId={
                      mode === "create" ? advertisementImageDraftIdRef.current : undefined
                    }
                    label="Image du badge (offre partenaire)"
                    description={
                      mode === "create"
                        ? "Optionnel (JPEG, PNG, WebP). Même brouillon que l’image campagne : enregistrez la fiche pour finaliser les fichiers. Champ vide = même visuel que l’image de la campagne."
                        : `Téléversement dans uploads/advertisements/${advertisementId ?? "…"}/. Champ vide : le badge utilise l’image de la campagne.`
                    }
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={!caps.adventure.update}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="partnerMaxRedemptionsPerUser"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ad-partner-max">
                      Validations max / joueur
                    </FieldLabel>
                    <Input
                      id="ad-partner-max"
                      type="number"
                      min={1}
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                      value={String(field.value ?? 1)}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                name="partnerClaimsOpen"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal" className="items-end gap-2 pb-2">
                    <Checkbox
                      id="ad-partner-claims-open"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                    <FieldLabel htmlFor="ad-partner-claims-open" className="font-normal">
                      Accepter de nouvelles demandes
                    </FieldLabel>
                  </Field>
                )}
              />
            </div>
            <Field>
              <FieldLabel>Commerçants validateurs</FieldLabel>
              <p className="mb-2 text-xs text-muted-foreground">
                Comptes avec le rôle « commerçant » (défini par un super administrateur). Ils
                traitent les demandes depuis l&apos;application mobile (API{" "}
                <span className="font-mono">/api/merchant/partner-claims</span>).
              </p>
              <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                {merchantOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun utilisateur commerçant. Attribuez le rôle « Commerçant » dans
                    Utilisateurs.
                  </p>
                ) : (
                  merchantOptions.map((m) => (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center gap-3 text-sm"
                    >
                      <Checkbox
                        checked={merchantUserIds.has(m.id)}
                        onCheckedChange={(checked) =>
                          toggleMerchant(m.id, checked === true)
                        }
                      />
                      <span>
                        {m.name ?? m.email}
                        <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </Field>
          </div>
        </Field>

        <Field>
          <FieldLabel>Ciblage par villes (référentiel)</FieldLabel>
          <p className="mb-2 text-xs text-muted-foreground">
            Aucune case : pas de filtre par ville du référentiel (règle produit + coordonnées éventuelles via l’API).
          </p>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-input p-3">
            {cities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune ville.{" "}
                <Link href="/admin-game/dashboard/villes/create" className="underline">
                  En créer une
                </Link>
                .
              </p>
            ) : (
              cities.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 text-sm"
                >
                  <Checkbox
                    checked={targetCityIds.has(c.id)}
                    onCheckedChange={(checked) => toggleCity(c.id, checked === true)}
                  />
                  <span>{c.name}</span>
                </label>
              ))
            )}
          </div>
        </Field>

        <Field>
          <FieldLabel>Zone circulaire sur la carte (optionnel)</FieldLabel>
          <p className="mb-2 text-xs text-muted-foreground">
            Clic ou recherche d’adresse pour le centre, curseur pour le rayon. Les trois valeurs
            doivent être cohérentes pour activer le filtre par distance, ou tout laisser vide.
          </p>
          <LocationPicker
            latitude={mapPickerLat}
            longitude={mapPickerLng}
            onChange={handleGeoTargetChange}
            radiusMeters={circleRadius}
            markerPopupLabel="Centre du ciblage (publicité)"
            helperText="Après le centre, réglez le rayon ci-dessous (250 m à 100 km)."
            mapClassName="h-[22rem]"
          />
          <div className="mt-3 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="ad-geo-radius" className="text-sm font-medium sm:min-w-28">
                Rayon du disque
              </label>
              <input
                id="ad-geo-radius"
                type="range"
                className="h-2 flex-1 cursor-pointer accent-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
                min={250}
                max={100_000}
                step={250}
                disabled={!hasGeoCenter}
                value={geoRadiusSliderValue}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  form.setValue("targetRadiusMeters", String(v), { shouldDirty: true });
                }}
              />
              <span className="text-sm text-muted-foreground tabular-nums sm:w-28 sm:text-right">
                {geoRadiusSliderValue >= 1000
                  ? `${(geoRadiusSliderValue / 1000).toLocaleString("fr-FR", {
                      maximumFractionDigits: geoRadiusSliderValue % 1000 === 0 ? 0 : 2,
                    })} km`
                  : `${geoRadiusSliderValue} m`}
              </span>
            </div>
            {!hasGeoCenter ? (
              <p className="text-xs text-muted-foreground">
                Placez d’abord le centre sur la carte pour activer le rayon.
              </p>
            ) : !radTrim ? (
              <p className="text-xs text-amber-700 dark:text-amber-500">
                Définissez un rayon (curseur ou champ) pour enregistrer la zone, ou effacez la zone.
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue("targetCenterLatitude", "", { shouldDirty: true });
                form.setValue("targetCenterLongitude", "", { shouldDirty: true });
                form.setValue("targetRadiusMeters", "", { shouldDirty: true });
              }}
            >
              Effacer la zone
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Ajustement précis (latitude, longitude, rayon en mètres) :
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Controller
              name="targetCenterLatitude"
              control={form.control}
              render={({ field }) => (
                <Input {...field} placeholder="Latitude" autoComplete="off" type="text" />
              )}
            />
            <Controller
              name="targetCenterLongitude"
              control={form.control}
              render={({ field }) => (
                <Input {...field} placeholder="Longitude" autoComplete="off" type="text" />
              )}
            />
            <Controller
              name="targetRadiusMeters"
              control={form.control}
              render={({ field }) => (
                <Input {...field} placeholder="Rayon (m)" autoComplete="off" type="text" />
              )}
            />
          </div>
        </Field>

        <Field orientation="horizontal">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin-game/dashboard/publicites">Annuler</Link>
          </Button>
          <GuardedButton
            type="submit"
            allowed={caps.adventure.update}
            denyReason="Gestion des publicités : droit aventure « mise à jour » requis."
          >
            {mode === "create" ? "Créer" : "Enregistrer"}
          </GuardedButton>
        </Field>

        {mode === "edit" && advertisementId ? (
          <Field>
            <GuardedButton
              type="button"
              variant="destructive"
              allowed={caps.adventure.update}
              denyReason="Suppression : droit aventure « mise à jour » requis."
              onClick={handleDelete}
            >
              Supprimer
            </GuardedButton>
          </Field>
        ) : null}
      </FieldGroup>
    </form>
  );
}
