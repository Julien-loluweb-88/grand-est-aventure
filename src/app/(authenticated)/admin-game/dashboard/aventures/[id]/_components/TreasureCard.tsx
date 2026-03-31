"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, MapPin, Shield } from "lucide-react";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tiptapStoredValueToPlainText } from "@/lib/adventure-description-tiptap";
import { TreasureEditForm } from "./TreasureEditForm";
import { deleteTreasure } from "../_lib/treasure.action";
import type { TreasureEditPayload } from "../_lib/treasure-edit-payload";
import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";

type Props = {
  adventureId: string;
  treasure: TreasureEditPayload;
  mapReferenceMarkers: LocationPickerContextMarker[];
  routePolyline: [number, number][] | null;
};

function formatCoord(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });
}

export function TreasureCard({
  adventureId,
  treasure,
  mapReferenceMarkers,
  routePolyline,
}: Props) {
  const caps = useAdminCapabilities();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const descPreview = tiptapStoredValueToPlainText(treasure.description);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const result = await deleteTreasure(treasure.id, adventureId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setDeleteOpen(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }, [adventureId, router, treasure.id]);

  return (
    <>
      <Card className="mb-6 w-full">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <span className="inline-flex w-fit rounded-none border bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Point d&apos;arrivée
              </span>
              <CardTitle className="text-base font-semibold leading-snug tracking-tight">
                {treasure.name}
              </CardTitle>
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="font-mono tabular-nums">
                  {formatCoord(treasure.latitude)}°, {formatCoord(treasure.longitude)}°
                </span>
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {descPreview ? (
            <div className="rounded-none border p-3 text-sm leading-relaxed text-muted-foreground">
              <p className="line-clamp-6 whitespace-pre-wrap">{descPreview}</p>
            </div>
          ) : (
            <p className="rounded-none border border-dashed p-3 text-sm italic text-muted-foreground">
              Aucune description renseignée.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-none border p-3.5">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <KeyRound className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Révélation carte
                </span>
              </div>
              <p className="break-all font-mono text-sm font-semibold tracking-wide">
                {treasure.mapRevealCode}
              </p>
            </div>
            <div className="rounded-none border p-3.5">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Shield className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Variante (carte)
                </span>
              </div>
              <p className="break-all font-mono text-sm font-semibold tracking-wide">
                {treasure.mapRevealCodeAlt ?? "—"}
              </p>
            </div>
            <div className="rounded-none border p-3.5">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <KeyRound className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Code coffre
                </span>
              </div>
              <p className="break-all font-mono text-sm font-semibold tracking-wide">
                {treasure.chestCode}
              </p>
            </div>
            <div className="rounded-none border p-3.5">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Shield className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Variante (coffre)
                </span>
              </div>
              <p className="break-all font-mono text-sm font-semibold tracking-wide">
                {treasure.chestCodeAlt ?? "—"}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <TreasureEditForm
            adventureId={adventureId}
            treasure={treasure}
            mapReferenceMarkers={mapReferenceMarkers}
            routePolyline={routePolyline}
          />
          <GuardedButton
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto sm:min-w-[8.5rem]"
            allowed={caps.adventure.update}
            denyReason="Vous ne pouvez pas supprimer ce trésor."
            type="button"
            onClick={() => setDeleteOpen(true)}
          >
            Supprimer
          </GuardedButton>
        </CardFooter>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le trésor ?</DialogTitle>
            <DialogDescription>
              Cette action est définitive. L&apos;aventure n&apos;aura plus de
              trésor ; vous pourrez en créer un nouveau ensuite.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
