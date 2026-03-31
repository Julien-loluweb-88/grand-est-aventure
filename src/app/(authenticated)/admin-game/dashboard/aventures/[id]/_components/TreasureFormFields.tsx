"use client";

import type { Control, UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LocationPicker } from "@/components/location/LocationPicker";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";
import { AdventureDescriptionEditor } from "@/components/adventure/AdventureDescriptionEditor";
import { DashboardImageUploadField } from "@/components/uploads/DashboardImageUploadField";
import type { TreasureCreateFormValues } from "../_lib/treasure-form-schema";

export type TreasureFormUiModel = TreasureCreateFormValues;

export type TreasureFormRhfFragment = Pick<
  UseFormReturn<TreasureFormUiModel>,
  "setValue" | "formState"
>;

type TreasureFormFieldsProps = {
  control: Control<TreasureFormUiModel>;
  form: TreasureFormRhfFragment;
  latitudeValue: unknown;
  longitudeValue: unknown;
  mapReferenceMarkers: LocationPickerContextMarker[];
  displayRoutePolyline: [number, number][] | null;
  mapHelperText: string;
  canEdit: boolean;
  fieldSetDescription: string;
  adventureId: string;
};

export function TreasureFormFields({
  control,
  form,
  latitudeValue,
  longitudeValue,
  mapReferenceMarkers,
  displayRoutePolyline,
  mapHelperText,
  canEdit,
  fieldSetDescription,
  adventureId,
}: TreasureFormFieldsProps) {
  return (
    <FieldGroup className="space-y-4">
      <FieldSet>
        <FieldDescription>{fieldSetDescription}</FieldDescription>
        <div className="grid gap-3 md:grid-cols-2">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Nom de trésor</FieldLabel>
                <Input
                  className="w-100!"
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  placeholder="Ex. : nom du trésor"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="mapRevealCode"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Code révélation (carte)</FieldLabel>
                <FieldDescription>
                  Fin d’énigmes : ce que le joueur saisit pour <strong>afficher le trésor sur la carte</strong>{" "}
                  (étape <code className="text-xs">treasure:map</code>).
                </FieldDescription>
                <Input
                  className="w-100!"
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  placeholder="Combinaison ou mot de passe de fin"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="mapRevealCodeAlt"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Variante tolérée (carte)</FieldLabel>
                <FieldDescription>
                  Optionnel : autre forme acceptée pour la même révélation (orthographe, etc.).
                </FieldDescription>
                <Input
                  className="w-100!"
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  placeholder="Laisser vide si inutile"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="chestCode"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Code dans le trésor (coffre)</FieldLabel>
                <FieldDescription>
                  Ce qui est sur / dans le support physique, saisi <strong>après</strong> la révélation
                  sur la carte (étape <code className="text-xs">treasure</code>).
                </FieldDescription>
                <Input
                  className="w-100!"
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  placeholder="Code étiquette, gravure"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="chestCodeAlt"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Variante tolérée (coffre)</FieldLabel>
                <FieldDescription>
                  Optionnel : autre forme acceptée pour le code coffre.
                </FieldDescription>
                <Input
                  className="w-100!"
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  placeholder="Laisser vide si inutile"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => (
              <div className="md:col-span-2">
                <DashboardImageUploadField
                  scope="treasure"
                  adventureId={adventureId}
                  label="Image du trésor"
                  description="Racine du projet : uploads/adventures/{id}/treasure.*"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={!canEdit}
                />
              </div>
            )}
          />
          <Controller
            name="latitude"
            control={control}
            render={({ field, fieldState }) => (
              <Field
                className="md:col-span-2"
                data-invalid={fieldState.invalid || Boolean(form.formState.errors.longitude)}
              >
                <FieldLabel>Position sur la carte</FieldLabel>
                <LocationPicker
                  latitude={Number(latitudeValue ?? 0)}
                  longitude={Number(longitudeValue ?? 0)}
                  onChange={({ latitude, longitude }) => {
                    form.setValue("latitude", latitude, { shouldDirty: true, shouldValidate: true });
                    form.setValue("longitude", longitude, { shouldDirty: true, shouldValidate: true });
                  }}
                  helperText={mapHelperText}
                  contextMarkers={mapReferenceMarkers}
                  routePolyline={displayRoutePolyline}
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input
                    {...field}
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    autoComplete="off"
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                  <Input
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    autoComplete="off"
                    value={String(longitudeValue ?? "")}
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
        </div>
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <FieldGroup>
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <AdventureDescriptionEditor
                  id={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!canEdit}
                  aria-invalid={fieldState.invalid}
                  richTextImageUploadAdventureId={adventureId}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            </FieldGroup>
          )}
        />
      </FieldSet>
    </FieldGroup>
  );
}
