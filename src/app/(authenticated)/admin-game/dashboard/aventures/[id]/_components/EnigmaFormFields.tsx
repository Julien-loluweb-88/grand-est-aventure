"use client";

import type { ReactNode } from "react";
import type { Control, UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LocationPicker } from "@/components/location/LocationPicker";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";
import { AdventureDescriptionEditor } from "@/components/adventure/AdventureDescriptionEditor";
import { DashboardImageUploadField } from "@/components/uploads/DashboardImageUploadField";
import type { EnigmaCreateFormValues } from "../_lib/enigma-form-schema";

/** Modèle des champs pour `Control` (soumis aux schémas Zod create / edit). */
export type EnigmaFormUiModel = EnigmaCreateFormValues & { number?: number };

export type EnigmaFormRhfFragment = Pick<
  UseFormReturn<EnigmaFormUiModel>,
  "setValue" | "formState"
>;

type EnigmaFormFieldsProps = {
  control: Control<EnigmaFormUiModel>;
  form: EnigmaFormRhfFragment;
  choiceInputs: string[];
  syncChoices: (next: string[]) => void;
  latitudeValue: unknown;
  longitudeValue: unknown;
  contextMarkers: LocationPickerContextMarker[];
  displayRoutePolyline: [number, number][] | null;
  mapHelperText: string;
  canEdit: boolean;
  adventureId: string;
  /** Absent en création : nom de fichier UUID ; en édition : `enigmas/{id}.*`. */
  enigmaId?: string;
  /** Bloc « ordre » (création : n° auto ; édition : texte + input caché). */
  orderSlot: ReactNode;
  /** Enveloppe FieldSet + description (formulaire création uniquement). */
  wrapFirstBlockInFieldSet: boolean;
  fieldSetIntro?: ReactNode;
};

export function EnigmaFormFields({
  control,
  form,
  choiceInputs,
  syncChoices,
  latitudeValue,
  longitudeValue,
  contextMarkers,
  displayRoutePolyline,
  mapHelperText,
  canEdit,
  adventureId,
  enigmaId,
  orderSlot,
  wrapFirstBlockInFieldSet,
  fieldSetIntro,
}: EnigmaFormFieldsProps) {
  const nameQuestionGrid = (
    <div className="grid gap-3 md:grid-cols-2">
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Nom d&apos;énigme</FieldLabel>
            <Input
              className="w-100!"
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              autoComplete="off"
              placeholder={"Ex. : nom de l'énigme"}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {orderSlot}
      <Controller
        name="question"
        control={control}
        render={({ field, fieldState }) => (
          <Field className="md:col-span-2" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Question</FieldLabel>
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
    </div>
  );

  const answerBlock = (
    <Controller
      name="answer"
      control={control}
      render={({ field, fieldState }) => {
        const selectedIndex = choiceInputs.findIndex((c) => c === field.value);
        const selectedRadioValue = selectedIndex >= 0 ? String(selectedIndex) : "none";

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Choix de la réponse</FieldLabel>

            <RadioGroup
              value={selectedRadioValue}
              onValueChange={(v) => {
                const idx = Number(v);
                field.onChange(choiceInputs[idx] ?? "");
              }}
              className="mt-2"
            >
              <div className="space-y-2">
                {choiceInputs.map((value, index) => {
                  const isEmpty = value.trim() === "";
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={String(index)}
                        disabled={isEmpty}
                        aria-label={`Réponse ${index + 1}`}
                      />

                      <Input
                        value={value}
                        className="flex-1"
                        aria-label={`Choix ${index + 1}`}
                        autoComplete="off"
                        placeholder={`Choix ${index + 1}`}
                        onChange={(e) => {
                          const next = choiceInputs.map((c, i) =>
                            i === index ? e.target.value : c
                          );
                          syncChoices(next);
                        }}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = choiceInputs.filter((_, i) => i !== index);
                          syncChoices(next.length > 0 ? next : [""]);
                        }}
                        disabled={choiceInputs.length <= 1}
                      >
                        Retirer
                      </Button>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}

            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => syncChoices([...choiceInputs, ""])}
              >
                Ajouter un choix
              </Button>
            </div>
          </Field>
        );
      }}
    />
  );

  const firstBlock = wrapFirstBlockInFieldSet ? (
    <FieldSet>
      {fieldSetIntro}
      {nameQuestionGrid}
      {answerBlock}
    </FieldSet>
  ) : (
    <>
      {nameQuestionGrid}
      {answerBlock}
    </>
  );

  return (
    <FieldGroup className="space-y-4">
      {firstBlock}

      <Controller
        name="answerMessage"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Message (après bonne réponse)</FieldLabel>
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
        )}
      />

      <Controller
        name="imageUrl"
        control={control}
        render={({ field }) => (
          <DashboardImageUploadField
            scope="enigma"
            adventureId={adventureId}
            enigmaId={enigmaId}
            label="Image de l'énigme"
            description={
              enigmaId
                ? "Racine du projet : uploads/adventures/…/enigmas/{id}.*"
                : "Création : uploads/…/enigmas/{uuid}.* ; ou coller une URL."
            }
            value={field.value ?? ""}
            onChange={field.onChange}
            disabled={!canEdit}
          />
        )}
      />

      <Controller
        name="latitude"
        control={control}
        render={({ field, fieldState }) => (
          <Field
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
              contextMarkers={contextMarkers}
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

      <FieldSet>
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
