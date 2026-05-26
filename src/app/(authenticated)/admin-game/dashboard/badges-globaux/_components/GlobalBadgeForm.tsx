"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type Resolver } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../AdminCapabilitiesProvider";
import { DashboardImageUploadField } from "@/components/uploads/DashboardImageUploadField";
import {
  createGlobalBadge,
  updateGlobalBadge,
  deleteGlobalBadge,
} from "../global-badge.action";
import {
  ADMIN_GLOBAL_BADGE_KIND_VALUES,
  GLOBAL_BADGE_KIND_META,
  type AdminGlobalBadgeKindValue,
} from "@/lib/badges/global-badge-kind-meta";
import { MILESTONE_BADGE_TITLE_MAX_CHARS } from "@/lib/dashboard-text-limits";
import { FieldCharacterCount } from "@/components/ui/field-character-count";

const kindSchema = z.enum([
  "MILESTONE_ADVENTURES",
  "MILESTONE_KM",
  "SPECIAL_TIME_WINDOW",
  "PERFORMANCE_STREAK",
  "PERFORMANCE_MONTHLY_KM",
]);

const schema = z.object({
  title: z
    .string()
    .min(1, "Libellé requis.")
    .max(MILESTONE_BADGE_TITLE_MAX_CHARS, `${MILESTONE_BADGE_TITLE_MAX_CHARS} caractères maximum`),
  kind: kindSchema,
  threshold: z.coerce.number().int().min(1).max(1_000_000).optional(),
  startHour: z.coerce.number().int().min(0).max(23).optional(),
  endHour: z.coerce.number().int().min(0).max(23).optional(),
  streakWeeks: z.coerce.number().int().min(1).max(52).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999_999),
  imageUrl: z.string().max(2048).optional().default(""),
});

type FormValues = z.infer<typeof schema>;

export type GlobalBadgeFormProps = {
  mode: "create" | "edit";
  badgeId?: string;
  slug?: string;
  defaultValues?: Partial<FormValues>;
};

export function GlobalBadgeForm({
  mode,
  badgeId,
  slug,
  defaultValues,
}: GlobalBadgeFormProps) {
  const router = useRouter();
  const caps = useAdminCapabilities();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      kind: "MILESTONE_ADVENTURES",
      threshold: 1,
      startHour: 21,
      endHour: 6,
      streakWeeks: 4,
      sortOrder: 0,
      imageUrl: "",
      ...defaultValues,
    },
  });

  const kind = form.watch("kind") as AdminGlobalBadgeKindValue;
  const meta = GLOBAL_BADGE_KIND_META[kind];

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      title: values.title,
      kind: values.kind,
      sortOrder: values.sortOrder,
      imageUrl: values.imageUrl ?? "",
      threshold: values.threshold,
      startHour: values.startHour,
      endHour: values.endHour,
      streakWeeks: values.streakWeeks,
    };
    if (mode === "create") {
      const res = await createGlobalBadge(payload);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Badge créé.");
      router.push(`/admin-game/dashboard/badges-globaux/${res.id}`);
      router.refresh();
      return;
    }
    if (!badgeId) return;
    const res = await updateGlobalBadge(badgeId, payload);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Badge mis à jour.");
    router.refresh();
  });

  const onDelete = async () => {
    if (!badgeId) return;
    if (
      !window.confirm(
        "Supprimer ce badge ? Les joueurs perdront aussi l’entrée dans leur collection."
      )
    ) {
      return;
    }
    const res = await deleteGlobalBadge(badgeId);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Badge supprimé.");
    router.push("/admin-game/dashboard/badges-globaux");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {mode === "edit" && slug ? (
        <Field>
          <FieldLabel>Slug (technique)</FieldLabel>
          <Input value={slug} readOnly disabled className="font-mono text-xs" />
        </Field>
      ) : null}

      <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{meta.label}</span>
        {" — "}
        {meta.shortHelp}
        <br />
        <span className="text-xs">Déclencheur : {meta.triggerLabel}</span>
      </p>

      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="gb-title">Libellé affiché</FieldLabel>
              <Input
                id="gb-title"
                {...field}
                maxLength={MILESTONE_BADGE_TITLE_MAX_CHARS}
                placeholder="Ex. Explorateur nocturne"
              />
              <div className="flex justify-end pt-0.5">
                <FieldCharacterCount
                  length={field.value?.length ?? 0}
                  max={MILESTONE_BADGE_TITLE_MAX_CHARS}
                />
              </div>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="kind"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Règle d’attribution</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!caps.adventure.update || mode === "edit"}
              >
                <SelectTrigger className="w-full max-w-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_GLOBAL_BADGE_KIND_VALUES.map((k) => (
                    <SelectItem key={k} value={k}>
                      {GLOBAL_BADGE_KIND_META[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === "edit" ? (
                <p className="text-xs text-muted-foreground">
                  Le type ne peut pas être modifié après création (évite les incohérences de critères).
                </p>
              ) : null}
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        {meta.needsThreshold ? (
          <Controller
            name="threshold"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="gb-threshold">Seuil numérique</FieldLabel>
                <Input id="gb-threshold" type="number" min={1} max={1_000_000} {...field} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        ) : null}

        {meta.needsTimeWindow ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="startHour"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="gb-start">Heure de début (Paris)</FieldLabel>
                  <Input id="gb-start" type="number" min={0} max={23} {...field} />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="endHour"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="gb-end">Heure de fin (Paris)</FieldLabel>
                  <Input id="gb-end" type="number" min={0} max={23} {...field} />
                  <p className="text-xs text-muted-foreground">
                    Plage typique nocturne : 21 → 6 (fin avant 6h du matin).
                  </p>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </div>
        ) : null}

        {meta.needsStreakWeeks ? (
          <Controller
            name="streakWeeks"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="gb-streak">Semaines consécutives</FieldLabel>
                <Input id="gb-streak" type="number" min={1} max={52} {...field} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        ) : null}

        <Controller
          name="sortOrder"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="gb-order">Ordre d’affichage</FieldLabel>
              <Input id="gb-order" type="number" min={0} max={999_999} {...field} />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="imageUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <DashboardImageUploadField
                scope="milestone-badge"
                label="Image du badge"
                description="Optionnel. Fichiers sous uploads/badges/milestone/."
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={!caps.adventure.update}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <GuardedButton
          type="submit"
          allowed={caps.adventure.update}
          denyReason="Badges globaux : droit aventure « mise à jour » requis."
        >
          {mode === "create" ? "Créer" : "Enregistrer"}
        </GuardedButton>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin-game/dashboard/badges-globaux">Annuler</Link>
        </Button>
        {mode === "edit" && badgeId ? (
          <GuardedButton
            type="button"
            variant="destructive"
            allowed={caps.adventure.update}
            denyReason="Suppression : droit aventure « mise à jour » requis."
            onClick={() => void onDelete()}
          >
            Supprimer
          </GuardedButton>
        ) : null}
      </div>
    </form>
  );
}
