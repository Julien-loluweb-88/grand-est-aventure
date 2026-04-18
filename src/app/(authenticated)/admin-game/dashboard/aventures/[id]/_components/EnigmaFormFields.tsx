"use client";

import type { ReactNode } from "react";
import type { Control, UseFormReturn } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LocationPicker } from "@/components/location/LocationPicker";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";
import { AdventureDescriptionEditor } from "@/components/adventure/AdventureDescriptionEditor";
import { EditorialRewriteControl } from "@/components/admin/EditorialRewriteControl";
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
  const multiSelect = useWatch({ control, name: "multiSelect", defaultValue: false }) ?? false;

  const nameQuestionGrid = (
    <div className="grid gap-3 md:grid-cols-2">
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldLabel htmlFor={field.name}>Nom d&apos;énigme</FieldLabel>
              {canEdit ? (
                <EditorialRewriteControl
                  scope={{ type: "adventure", adventureId }}
                  getSourceText={() => String(field.value ?? "")}
                  onApply={(t) => field.onChange(t)}
                  disabled={!canEdit}
                  dialogTitle="Reformuler le nom d’énigme"
                />
              ) : null}
            </div>
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
        name="imageUrl"
        control={control}
        render={({ field }) => (
          <div className="md:col-span-2">
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
          </div>
        )}
      />
      <Controller
        name="question"
        control={control}
        render={({ field, fieldState }) => (
          <Field className="md:col-span-2" data-invalid={fieldState.invalid}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldLabel htmlFor={field.name}>Question</FieldLabel>
              {canEdit ? (
                <EditorialRewriteControl
                  scope={{ type: "adventure", adventureId }}
                  getSourceText={() => String(field.value ?? "")}
                  onApply={(t) => field.onChange(t)}
                  disabled={!canEdit}
                  dialogTitle="Reformuler la question"
                />
              ) : null}
            </div>
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

  const choiceRows = (opts: {
    leading: (index: number, isEmpty: boolean) => ReactNode;
  }) => (
    <div className="space-y-2">
      {choiceInputs.map((value, index) => {
        const isEmpty = value.trim() === "";
        return (
          <div key={index} className="flex items-center gap-2">
            {opts.leading(index, isEmpty)}
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
  );

  const answerBlock = (
    <>
      <Controller
        name="multiSelect"
        control={control}
        render={({ field }) => (
          <Field className="md:col-span-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="enigma-multi-select"
                checked={field.value === true}
                onCheckedChange={(c) => field.onChange(c === true)}
                className="mt-1"
              />
              <div className="space-y-1">
                <FieldLabel htmlFor="enigma-multi-select" className="font-medium">
                  Plusieurs bonnes réponses
                </FieldLabel>
                <FieldDescription>
                  Le joueur peut cocher plusieurs choix ; sa sélection doit correspondre exactement à
                  l’ensemble des réponses que vous cochez ci-dessous.
                </FieldDescription>
              </div>
            </div>
          </Field>
        )}
      />

      {multiSelect ? (
        <Controller
          name="correctChoiceFlags"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Cochez chaque bonne réponse</FieldLabel>
              {choiceRows({
                leading: (index) => (
                  <Checkbox
                    checked={field.value?.[index] ?? false}
                    onCheckedChange={(c) => {
                      const next = [...(field.value ?? [])];
                      while (next.length < choiceInputs.length) {
                        next.push(false);
                      }
                      next[index] = c === true;
                      field.onChange(next);
                    }}
                    aria-label={`Bonne réponse ${index + 1}`}
                  />
                ),
              })}
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
          )}
        />
      ) : (
        <Controller
          name="answer"
          control={control}
          render={({ field, fieldState }) => {
            const selectedIndex = choiceInputs.findIndex((c) => c === field.value);
            const selectedRadioValue = selectedIndex >= 0 ? String(selectedIndex) : "none";

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Une seule bonne réponse</FieldLabel>
                <RadioGroup
                  value={selectedRadioValue}
                  onValueChange={(v) => {
                    const idx = Number(v);
                    field.onChange(choiceInputs[idx] ?? "");
                  }}
                  className="mt-2"
                >
                  {choiceRows({
                    leading: (index, isEmpty) => (
                      <RadioGroupItem
                        value={String(index)}
                        disabled={isEmpty}
                        aria-label={`Réponse ${index + 1}`}
                      />
                    ),
                  })}
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
      )}
    </>
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
              editorialRewrite={
                canEdit ? { scope: { type: "adventure", adventureId } } : undefined
              }
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
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
                  editorialRewrite={
                    canEdit ? { scope: { type: "adventure", adventureId } } : undefined
                  }
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
