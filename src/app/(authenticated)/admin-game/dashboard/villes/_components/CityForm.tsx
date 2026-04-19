"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../AdminCapabilitiesProvider";
import { createCity, updateCity, deleteCity } from "../city.action";
import {
  fetchCommunesByNameFromGeoApi,
  fetchCommuneByInseeFromGeoApi,
  type GeoCommuneDto,
} from "@/lib/geo-api-gouv-fr";
import {
  CITY_COORDINATE_STRING_MAX_CHARS,
  CITY_INSEE_CODE_MAX_CHARS,
  CITY_NAME_MAX_CHARS,
  CITY_POPULATION_STRING_MAX_CHARS,
  CITY_POSTAL_CODES_RAW_MAX_CHARS,
  PARTNER_WHEEL_TERMS_MAX_CHARS,
} from "@/lib/dashboard-text-limits";
import { FieldCharacterCount } from "@/components/ui/field-character-count";

const schema = z.object({
  name: z
    .string()
    .min(2, "Au moins 2 caractères")
    .max(CITY_NAME_MAX_CHARS, `${CITY_NAME_MAX_CHARS} caractères maximum`),
  inseeCode: z.string().max(CITY_INSEE_CODE_MAX_CHARS),
  postalCodesRaw: z
    .string()
    .max(CITY_POSTAL_CODES_RAW_MAX_CHARS, `${CITY_POSTAL_CODES_RAW_MAX_CHARS} caractères maximum`)
    .optional()
    .default(""),
  latitude: z
    .string()
    .max(CITY_COORDINATE_STRING_MAX_CHARS)
    .optional()
    .default(""),
  longitude: z
    .string()
    .max(CITY_COORDINATE_STRING_MAX_CHARS)
    .optional()
    .default(""),
  population: z
    .string()
    .max(CITY_POPULATION_STRING_MAX_CHARS)
    .optional()
    .default(""),
  partnerWheelTerms: z
    .string()
    .max(
      PARTNER_WHEEL_TERMS_MAX_CHARS,
      `${PARTNER_WHEEL_TERMS_MAX_CHARS} caractères maximum`
    )
    .optional()
    .default(""),
});

export type CityFormProps = {
  mode: "create" | "edit";
  cityId?: string;
  defaultValues?: Partial<z.infer<typeof schema>>;
};

export function CityForm({ mode, cityId, defaultValues }: CityFormProps) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const geoBlockId = useId();
  const [geoNomQuery, setGeoNomQuery] = useState("");
  const [geoNomOpen, setGeoNomOpen] = useState(false);
  const [geoNomResults, setGeoNomResults] = useState<GeoCommuneDto[]>([]);
  const [geoNomLoading, setGeoNomLoading] = useState(false);
  const [inseeLookup, setInseeLookup] = useState("");
  const [inseeLoading, setInseeLoading] = useState(false);
  const geoNomSeq = useRef(0);
  const geoNomDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      inseeCode: "",
      postalCodesRaw: "",
      latitude: "",
      longitude: "",
      population: "",
      partnerWheelTerms: "",
      ...defaultValues,
    },
  });

  const canMutate = caps.adventure.update;

  const applyGeoCommune = useCallback(
    (c: GeoCommuneDto) => {
      form.setValue("name", c.name, { shouldDirty: true, shouldValidate: true });
      form.setValue("inseeCode", c.inseeCode, { shouldDirty: true, shouldValidate: true });
      form.setValue("postalCodesRaw", c.postalCodes.join(", "), {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("latitude", String(c.latitude), { shouldDirty: true, shouldValidate: true });
      form.setValue("longitude", String(c.longitude), { shouldDirty: true, shouldValidate: true });
      form.setValue(
        "population",
        c.population != null ? String(c.population) : "",
        { shouldDirty: true, shouldValidate: true }
      );
      toast.success("Champs préremplis depuis geo.api.gouv.fr — vérifiez puis enregistrez.");
    },
    [form]
  );

  useEffect(() => {
    if (geoNomDebounce.current) clearTimeout(geoNomDebounce.current);
    const q = geoNomQuery.trim();
    if (q.length < 2) {
      setGeoNomResults([]);
      setGeoNomLoading(false);
      return;
    }
    geoNomDebounce.current = setTimeout(() => {
      const seq = ++geoNomSeq.current;
      setGeoNomLoading(true);
      void fetchCommunesByNameFromGeoApi(q)
        .then((list) => {
          if (seq !== geoNomSeq.current) return;
          setGeoNomResults(list);
        })
        .catch(() => {
          if (seq !== geoNomSeq.current) return;
          setGeoNomResults([]);
          toast.error("Impossible de joindre geo.api.gouv.fr.");
        })
        .finally(() => {
          if (seq === geoNomSeq.current) setGeoNomLoading(false);
        });
    }, 320);
    return () => {
      if (geoNomDebounce.current) clearTimeout(geoNomDebounce.current);
    };
  }, [geoNomQuery]);

  const handleInseeImport = async () => {
    const code = inseeLookup.trim();
    if (!/^\d{5}$/.test(code)) {
      toast.error("Saisissez un code INSEE à 5 chiffres.");
      return;
    }
    setInseeLoading(true);
    try {
      const c = await fetchCommuneByInseeFromGeoApi(code);
      if (!c) {
        toast.error("Commune introuvable pour ce code INSEE.");
        return;
      }
      applyGeoCommune(c);
      setGeoNomQuery("");
      setGeoNomResults([]);
      setGeoNomOpen(false);
    } finally {
      setInseeLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (mode === "create") {
      const res = await createCity({
        name: data.name,
        inseeCode: data.inseeCode,
        postalCodesRaw: data.postalCodesRaw ?? "",
        latitude: data.latitude ?? "",
        longitude: data.longitude ?? "",
        population: data.population ?? "",
        partnerWheelTerms: data.partnerWheelTerms ?? "",
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Ville créée.");
      router.push(`/admin-game/dashboard/villes/${res.id}`);
      router.refresh();
      return;
    }

    if (!cityId) return;
    const res = await updateCity(cityId, {
      name: data.name,
      inseeCode: data.inseeCode,
      postalCodesRaw: data.postalCodesRaw ?? "",
      latitude: data.latitude ?? "",
      longitude: data.longitude ?? "",
      population: data.population ?? "",
      partnerWheelTerms: data.partnerWheelTerms ?? "",
    });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Ville mise à jour.");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!cityId || !canMutate) return;
    if (!confirm("Supprimer cette ville ? (impossible si une aventure y est liée.)")) return;
    const res = await deleteCity(cityId);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Ville supprimée.");
    router.push("/admin-game/dashboard/villes");
    router.refresh();
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, () => {
        toast.error("Vérifiez les champs.");
      })}
    >
      <FieldGroup>
        <div
          className="space-y-3 rounded-none border border-border bg-muted/20 p-4"
          aria-labelledby={`${geoBlockId}-title`}
        >
          <p id={`${geoBlockId}-title`} className="text-sm font-medium text-foreground">
            Préremplissage — geo.api.gouv.fr
          </p>
          <p className="text-xs text-muted-foreground">
            Recherche par nom ou import direct par code INSEE. Les données officielles remplissent le
            formulaire (tu peux les ajuster avant enregistrement).
          </p>
          <div className="relative max-w-md space-y-2">
            <FieldLabel htmlFor={`${geoBlockId}-nom`}>Recherche par nom</FieldLabel>
            <div className="relative">
              <Input
                id={`${geoBlockId}-nom`}
                value={geoNomQuery}
                onChange={(e) => {
                  setGeoNomQuery(e.target.value);
                  setGeoNomOpen(true);
                }}
                onFocus={() => setGeoNomOpen(true)}
                autoComplete="off"
                placeholder="Ex. Nancy, Colmar…"
                className="pr-9"
              />
              {geoNomLoading ? (
                <Loader2
                  className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                  aria-hidden
                />
              ) : null}
            </div>
            {geoNomOpen && geoNomResults.length > 0 ? (
              <ul
                role="listbox"
                className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-none border border-border bg-popover text-popover-foreground shadow-md"
              >
                {geoNomResults.map((c) => (
                  <li key={c.inseeCode} role="option">
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyGeoCommune(c);
                        setGeoNomQuery("");
                        setGeoNomResults([]);
                        setGeoNomOpen(false);
                      }}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        INSEE {c.inseeCode}
                        {c.postalCodes[0] ? ` · ${c.postalCodes[0]}` : ""}
                        {c.population != null
                          ? ` · ${c.population.toLocaleString("fr-FR")} hab.`
                          : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-2">
              <FieldLabel htmlFor={`${geoBlockId}-insee`}>Code INSEE</FieldLabel>
              <Input
                id={`${geoBlockId}-insee`}
                value={inseeLookup}
                onChange={(e) =>
                  setInseeLookup(
                    e.target.value.replace(/\D/g, "").slice(0, CITY_INSEE_CODE_MAX_CHARS)
                  )
                }
                autoComplete="off"
                placeholder="54000"
                className="w-28 font-mono"
                maxLength={CITY_INSEE_CODE_MAX_CHARS}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={inseeLoading}
              className="shrink-0"
              onClick={() => void handleInseeImport()}
            >
              {inseeLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Chargement…
                </>
              ) : (
                "Remplir depuis l’INSEE"
              )}
            </Button>
          </div>
        </div>

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nom</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="off"
                className="max-w-md"
                maxLength={CITY_NAME_MAX_CHARS}
              />
              <div className="flex justify-end pt-0.5">
                <FieldCharacterCount
                  length={field.value?.length ?? 0}
                  max={CITY_NAME_MAX_CHARS}
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="inseeCode"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Code INSEE (optionnel, 5 chiffres)</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="off"
                className="max-w-xs font-mono"
                maxLength={CITY_INSEE_CODE_MAX_CHARS}
              />
              <div className="flex justify-end pt-0.5">
                <FieldCharacterCount
                  length={field.value?.length ?? 0}
                  max={CITY_INSEE_CODE_MAX_CHARS}
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="postalCodesRaw"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Codes postaux (séparés par virgule ou espace)</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="off"
                className="max-w-md"
                maxLength={CITY_POSTAL_CODES_RAW_MAX_CHARS}
              />
              <div className="flex justify-end pt-0.5">
                <FieldCharacterCount
                  length={field.value?.length ?? 0}
                  max={CITY_POSTAL_CODES_RAW_MAX_CHARS}
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2 sm:max-w-xl">
          <Controller
            name="latitude"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Latitude (optionnel)</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  autoComplete="off"
                  maxLength={CITY_COORDINATE_STRING_MAX_CHARS}
                />
                <div className="flex justify-end pt-0.5">
                  <FieldCharacterCount
                    length={field.value?.length ?? 0}
                    max={CITY_COORDINATE_STRING_MAX_CHARS}
                  />
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="longitude"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Longitude (optionnel)</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  autoComplete="off"
                  maxLength={CITY_COORDINATE_STRING_MAX_CHARS}
                />
                <div className="flex justify-end pt-0.5">
                  <FieldCharacterCount
                    length={field.value?.length ?? 0}
                    max={CITY_COORDINATE_STRING_MAX_CHARS}
                  />
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        <Controller
          name="population"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Population (optionnel)</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="off"
                className="max-w-xs"
                maxLength={CITY_POPULATION_STRING_MAX_CHARS}
              />
              <div className="flex justify-end pt-0.5">
                <FieldCharacterCount
                  length={field.value?.length ?? 0}
                  max={CITY_POPULATION_STRING_MAX_CHARS}
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="partnerWheelTerms"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Règlement roue partenaires (optionnel)
              </FieldLabel>
              <p className="text-xs text-muted-foreground">
                S&apos;applique aux lots « toute la ville » et comme repli si une aventure n&apos;a
                pas de texte dédié. Conditions, durée, litiges, RGPD…
              </p>
              <Textarea
                {...field}
                id={field.name}
                rows={6}
                maxLength={PARTNER_WHEEL_TERMS_MAX_CHARS}
                className="min-h-24 font-mono text-sm"
                placeholder="Texte affiché aux joueurs (API `legalNotice`)…"
              />
              <div className="flex justify-end pt-0.5">
                <FieldCharacterCount
                  length={field.value?.length ?? 0}
                  max={PARTNER_WHEEL_TERMS_MAX_CHARS}
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Field orientation="horizontal">
          {mode === "edit" ? (
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Retour
            </Button>
          ) : (
            <Button type="button" variant="outline" asChild>
              <Link href="/admin-game/dashboard/villes">Annuler</Link>
            </Button>
          )}
          <GuardedButton type="submit" allowed={canMutate} denyReason="Modification des villes : droit aventure « mise à jour » requis.">
            {mode === "create" ? "Créer" : "Enregistrer"}
          </GuardedButton>
          {mode === "edit" && cityId ? (
            <GuardedButton
              type="button"
              variant="destructive"
              allowed={canMutate}
              denyReason="Suppression refusée."
              onClick={() => void handleDelete()}
            >
              Supprimer
            </GuardedButton>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
