"use client";

import { useCallback, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CitySelectOption } from "@/lib/city-types";
import {
  ADVERTISEMENT_INTERNAL_NAME_MAX_CHARS,
  ADVERTISEMENT_PARTNER_BADGE_TITLE_MAX_CHARS,
  ADVERTISEMENT_PARTNER_NAME_MAX_CHARS,
} from "@/lib/dashboard-text-limits";
import { LocationPicker } from "@/components/location/LocationPicker";
import {
  ADVERTISEMENT_PLACEMENTS,
  ADVERTISEMENT_PLACEMENT_VALUES,
} from "@/lib/advertisements/advertisement-placements";
import { createMerchantAdvertisementSlot } from "../advertisement-slot.action";
import type { MerchantSelectOption } from "./AdvertisementForm";

const DEFAULT_MAP_LAT = 48.4072318295932;
const DEFAULT_MAP_LNG = 6.843844487240165;

function parseCoord(s: string | undefined): number {
  const t = String(s ?? "").trim().replace(",", ".");
  if (!t) return NaN;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

const schema = z.object({
  name: z.string().min(1).max(ADVERTISEMENT_INTERNAL_NAME_MAX_CHARS),
  advertiserKind: z.enum(["SHOP", "ASSOCIATION", "MAIRIE", "OTHER"]),
  advertiserName: z.string().min(1).max(ADVERTISEMENT_PARTNER_NAME_MAX_CHARS),
  placement: z.enum(ADVERTISEMENT_PLACEMENT_VALUES),
  startsAt: z.string().optional().default(""),
  endsAt: z.string().optional().default(""),
  sortOrder: z.coerce.number().int().min(0).max(999999),
  targetCenterLatitude: z.string().max(32).optional().default(""),
  targetCenterLongitude: z.string().max(32).optional().default(""),
  targetRadiusMeters: z.string().max(16).optional().default(""),
  ownerMerchantUserId: z.string().min(1, "Commerçant requis."),
  partnerBadgeTitle: z
    .string()
    .max(ADVERTISEMENT_PARTNER_BADGE_TITLE_MAX_CHARS)
    .optional()
    .default(""),
});

export function AdvertisementSlotForm({
  cities,
  merchantOptions,
}: {
  cities: CitySelectOption[];
  merchantOptions: MerchantSelectOption[];
}) {
  const router = useRouter();
  const [targetCityIds, setTargetCityIds] = useState<Set<string>>(new Set());

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      advertiserKind: "SHOP" as const,
      advertiserName: "",
      placement: "home" as const,
      startsAt: "",
      endsAt: "",
      sortOrder: 0,
      targetCenterLatitude: "",
      targetCenterLongitude: "",
      targetRadiusMeters: "",
      ownerMerchantUserId: "",
      partnerBadgeTitle: "",
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

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await createMerchantAdvertisementSlot({
      ...values,
      startsAt: values.startsAt?.trim() ? values.startsAt : null,
      endsAt: values.endsAt?.trim() ? values.endsAt : null,
      targetCityIds: [...targetCityIds],
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Emplacement créé. Le commerçant peut le remplir.");
    router.push(`/admin-game/dashboard/publicites/${result.id}`);
    router.refresh();
  });

  const toggleCity = (cityId: string, checked: boolean) => {
    setTargetCityIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(cityId);
      else next.delete(cityId);
      return next;
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel>Commerçant propriétaire</FieldLabel>
          <Controller
            control={form.control}
            name="ownerMerchantUserId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un commerçant" />
                </SelectTrigger>
                <SelectContent>
                  {merchantOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name ?? m.email}
                      {m.merchantMaxAdvertisementSlots != null
                        ? ` — quota ${m.merchantMaxAdvertisementSlots}`
                        : " — quota non défini"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{form.formState.errors.ownerMerchantUserId?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Libellé interne</FieldLabel>
          <Input {...form.register("name")} />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Type d&apos;annonceur</FieldLabel>
            <Controller
              control={form.control}
              name="advertiserKind"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHOP">Commerce</SelectItem>
                    <SelectItem value="ASSOCIATION">Association</SelectItem>
                    <SelectItem value="MAIRIE">Mairie</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel>Nom partenaire (affiché)</FieldLabel>
            <Input {...form.register("advertiserName")} />
          </Field>
        </div>

        <Field>
          <FieldLabel>Nom du badge (collection joueur)</FieldLabel>
          <p className="mb-2 text-xs text-muted-foreground">
            Libellé stable en collection — ex. « PMU Raon · EMP1 ». Les promos iront dans le contenu
            pub du commerçant. Vous pourrez aussi le définir sur la fiche pub après création.
          </p>
          <Input
            {...form.register("partnerBadgeTitle")}
            placeholder="Ex. PMU Raon · EMP1"
            autoComplete="off"
          />
        </Field>

        <Field>
          <FieldLabel>Placement</FieldLabel>
          <Controller
            control={form.control}
            name="placement"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADVERTISEMENT_PLACEMENTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel>Début</FieldLabel>
            <Input type="datetime-local" {...form.register("startsAt")} />
          </Field>
          <Field>
            <FieldLabel>Fin</FieldLabel>
            <Input type="datetime-local" {...form.register("endsAt")} />
          </Field>
          <Field>
            <FieldLabel>Ordre</FieldLabel>
            <Input type="number" {...form.register("sortOrder")} />
          </Field>
        </div>

        <Field>
          <FieldLabel>Ciblage par villes (référentiel)</FieldLabel>
          <p className="mb-2 text-xs text-muted-foreground">
            Aucune case : pas de filtre par ville du référentiel (règle produit + coordonnées
            éventuelles via l&apos;API).
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
                <label key={c.id} className="flex cursor-pointer items-center gap-3 text-sm">
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
            Clic ou recherche d&apos;adresse pour le centre, curseur pour le rayon. Les trois
            valeurs doivent être cohérentes pour activer le filtre par distance, ou tout laisser
            vide.
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
              <label htmlFor="slot-geo-radius" className="text-sm font-medium sm:min-w-28">
                Rayon du disque
              </label>
              <input
                id="slot-geo-radius"
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
                Placez d&apos;abord le centre sur la carte pour activer le rayon.
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
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">Créer l&apos;emplacement</Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin-game/dashboard/publicites">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
