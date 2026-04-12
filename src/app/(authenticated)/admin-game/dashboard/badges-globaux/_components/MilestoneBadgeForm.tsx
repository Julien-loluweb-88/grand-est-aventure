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
  createMilestoneBadge,
  updateMilestoneBadge,
  deleteMilestoneBadge,
} from "../milestone-badge.action";
import type { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";

const kindSchema = z.enum(["MILESTONE_ADVENTURES", "MILESTONE_KM"]);

const schema = z.object({
  title: z.string().min(1, "Libellé requis.").max(200),
  kind: kindSchema,
  threshold: z.coerce.number().int().min(1).max(1_000_000),
  sortOrder: z.coerce.number().int().min(0).max(999_999),
  imageUrl: z.string().max(2048).optional().default(""),
});

type FormValues = z.infer<typeof schema>;

export type MilestoneBadgeFormProps = {
  mode: "create" | "edit";
  badgeId?: string;
  slug?: string;
  defaultValues?: Partial<FormValues>;
};

export function MilestoneBadgeForm({
  mode,
  badgeId,
  slug,
  defaultValues,
}: MilestoneBadgeFormProps) {
  const router = useRouter();
  const caps = useAdminCapabilities();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      kind: "MILESTONE_ADVENTURES",
      threshold: 1,
      sortOrder: 0,
      imageUrl: "",
      ...defaultValues,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (mode === "create") {
      const res = await createMilestoneBadge({
        title: values.title,
        kind: values.kind as BadgeDefinitionKind,
        threshold: values.threshold,
        sortOrder: values.sortOrder,
        imageUrl: values.imageUrl ?? "",
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Badge créé. Le slug a été généré automatiquement à partir du libellé.");
      router.push(`/admin-game/dashboard/badges-globaux/${res.id}`);
      router.refresh();
      return;
    }
    if (!badgeId) return;
    const res = await updateMilestoneBadge(badgeId, {
      title: values.title,
      kind: values.kind as BadgeDefinitionKind,
      threshold: values.threshold,
      sortOrder: values.sortOrder,
      imageUrl: values.imageUrl ?? "",
    });
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
        "Supprimer ce badge ? Les joueurs perdront aussi l’entrée dans leur collection (UserBadge)."
      )
    ) {
      return;
    }
    const res = await deleteMilestoneBadge(badgeId);
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
          <FieldLabel>Slug (technique, stable)</FieldLabel>
          <Input value={slug} readOnly disabled className="font-mono text-xs" />
          <p className="mt-1 text-xs text-muted-foreground">
            Généré automatiquement à la création ; non modifiable pour ne pas casser d’éventuelles intégrations.
          </p>
        </Field>
      ) : null}

      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="mb-title">Libellé</FieldLabel>
              <Input id="mb-title" {...field} placeholder="Ex. 10 aventures terminées" />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="kind"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Type de palier</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!caps.adventure.update}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MILESTONE_ADVENTURES">
                    Nombre d’aventures distinctes réussies
                  </SelectItem>
                  <SelectItem value="MILESTONE_KM">
                    Kilomètres cumulés (distance des parcours terminés)
                  </SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="threshold"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="mb-threshold">Seuil</FieldLabel>
              <Input id="mb-threshold" type="number" min={1} max={1_000_000} {...field} />
              <p className="text-xs text-muted-foreground">
                Minimum d’aventures réussies, ou somme des km (`Adventure.distance`) des aventures terminées, selon le type.
              </p>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="sortOrder"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="mb-order">Ordre d’affichage</FieldLabel>
              <Input id="mb-order" type="number" min={0} max={999_999} {...field} />
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
          denyReason="Badges paliers : droit aventure « mise à jour » requis."
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
