"use client";

import { useRef, useState } from "react";
import { uploadDashboardImage } from "@/lib/actions/upload-dashboard-image";
import type { DashboardImageScope } from "@/lib/uploads/dashboard-image-scope";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Props = {
  scope: DashboardImageScope;
  adventureId: string;
  /** Édition d’énigme : fige le nom de fichier sous `enigmas/{id}.*`. Création : laisser vide (UUID). */
  enigmaId?: string;
  label: string;
  description: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function DashboardImageUploadField({
  scope,
  adventureId,
  enigmaId,
  label,
  description,
  value,
  onChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("scope", scope);
      body.set("adventureId", adventureId);
      if (enigmaId) body.set("enigmaId", enigmaId);
      const res = await uploadDashboardImage(body);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onChange(res.url);
      toast.success("Image enregistrée sur le serveur.");
    } catch {
      toast.error("Téléversement impossible.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <p className="mb-2 text-xs text-muted-foreground">{description}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          placeholder="/uploads/adventures/… ou URL https://"
          disabled={disabled}
          className="font-mono text-xs sm:min-w-[16rem] sm:flex-1"
          autoComplete="off"
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(ev) => void onPick(ev)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Envoi…" : "Téléverser"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || !value}
            onClick={() => onChange("")}
          >
            Retirer
          </Button>
        </div>
      </div>
      {value ? (
        <div className="mt-2 overflow-hidden rounded-md border bg-muted/30 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- URL dynamique */}
          <img src={value} alt="" className="max-h-32 w-auto object-contain" />
        </div>
      ) : null}
    </Field>
  );
}
