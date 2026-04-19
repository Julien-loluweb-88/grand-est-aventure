"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import type { AvatarAdminEditPayload } from "../_lib/avatar-admin-queries";
import { AvatarGlbPreview } from "./AvatarGlbPreview";
import {
  clearAvatarModelAction,
  clearAvatarThumbnailAction,
  updateAvatarAction,
  uploadAvatarModelAction,
  uploadAvatarThumbnailAction,
} from "../_lib/avatar.action";

export function AvatarEditForm({ avatar }: { avatar: AvatarAdminEditPayload }) {
  const router = useRouter();
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(avatar.name);
  const [sortOrder, setSortOrder] = useState(String(avatar.sortOrder));
  const [isActive, setIsActive] = useState(avatar.isActive);
  const [metaPending, setMetaPending] = useState(false);
  const [thumbPending, setThumbPending] = useState(false);
  const [modelPending, setModelPending] = useState(false);

  const onSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setMetaPending(true);
    try {
      const so = parseInt(sortOrder, 10);
      const res = await updateAvatarAction({
        id: avatar.id,
        name,
        sortOrder: Number.isFinite(so) ? so : 0,
        isActive,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Modifications enregistrées.");
      router.refresh();
    } finally {
      setMetaPending(false);
    }
  };

  const uploadThumb = async (file: File) => {
    setThumbPending(true);
    try {
      const fd = new FormData();
      fd.set("avatarId", avatar.id);
      fd.set("file", file);
      const res = await uploadAvatarThumbnailAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Vignette enregistrée.");
      router.refresh();
    } finally {
      setThumbPending(false);
    }
  };

  const uploadModel = async (file: File) => {
    setModelPending(true);
    try {
      const fd = new FormData();
      fd.set("avatarId", avatar.id);
      fd.set("file", file);
      const res = await uploadAvatarModelAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Modèle .glb enregistré.");
      router.refresh();
    } finally {
      setModelPending(false);
    }
  };

  return (
    <div className="space-y-10">
      <form onSubmit={onSaveMeta} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="avatar-name-edit">Nom affiché</FieldLabel>
          <Input id="avatar-name-edit" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="avatar-order-edit">Ordre</FieldLabel>
          <Input
            id="avatar-order-edit"
            type="number"
            min={0}
            max={9999}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
          Avatar actif (visible dans l’app et choix joueur)
        </label>
        <Button type="submit" disabled={metaPending}>
          {metaPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>

      <div className="space-y-3 border-t pt-6">
        <h3 className="text-sm font-medium">Vignette (JPEG, PNG, WebP)</h3>
        {avatar.thumbnailUrl ? (
          <div className="flex flex-wrap items-end gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar.thumbnailUrl}
              alt=""
              className="h-20 w-20 rounded-md border object-cover"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={thumbPending}
              onClick={async () => {
                const res = await clearAvatarThumbnailAction(avatar.id);
                if (!res.ok) {
                  toast.error(res.error);
                  return;
                }
                toast.success("Vignette supprimée.");
                router.refresh();
              }}
            >
              Supprimer la vignette
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Aucune vignette.</p>
        )}
        <input
          ref={thumbInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void uploadThumb(f);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={thumbPending}
          onClick={() => thumbInputRef.current?.click()}
        >
          {thumbPending ? "Téléversement…" : "Téléverser une vignette"}
        </Button>
      </div>

      <div className="space-y-3 border-t pt-6">
        <h3 className="text-sm font-medium">Modèle 3D (.glb)</h3>
        {avatar.modelUrl ? (
          <div className="space-y-4">
            <p className="break-all font-mono text-xs text-muted-foreground">{avatar.modelUrl}</p>
            <AvatarGlbPreview modelUrl={avatar.modelUrl} posterUrl={avatar.thumbnailUrl} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={modelPending}
              onClick={async () => {
                const res = await clearAvatarModelAction(avatar.id);
                if (!res.ok) {
                  toast.error(res.error);
                  return;
                }
                toast.success("Modèle supprimé.");
                router.refresh();
              }}
            >
              Supprimer le modèle hébergé
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Aucun fichier sur le serveur : l’app utilisera le bundle local si présent.
          </p>
        )}
        <input
          ref={modelInputRef}
          type="file"
          accept=".glb,model/gltf-binary,application/octet-stream"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void uploadModel(f);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={modelPending}
          onClick={() => modelInputRef.current?.click()}
        >
          {modelPending ? "Téléversement…" : "Téléverser un .glb"}
        </Button>
      </div>
    </div>
  );
}
