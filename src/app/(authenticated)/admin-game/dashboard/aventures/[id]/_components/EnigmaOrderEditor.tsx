"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EnigmaOrderRow } from "../_lib/enigma-order-types";
import { reorderEnigmas } from "../_lib/enigma.action";

type Props = {
  adventureId: string;
  initialRows: EnigmaOrderRow[];
};

export function EnigmaOrderEditor({ adventureId, initialRows }: Props) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const [items, setItems] = useState<EnigmaOrderRow[]>(initialRows);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(initialRows);
  }, [initialRows]);

  const move = useCallback((index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[nextIndex]!;
      copy[nextIndex] = tmp!;
      return copy.map((row, i) => ({ ...row, number: i + 1 }));
    });
  }, []);

  const dirty =
    items.length !== initialRows.length ||
    items.some((row, i) => row.id !== initialRows[i]?.id);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const result = await reorderEnigmas(
        adventureId,
        items.map((r) => r.id)
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Ordre des énigmes enregistré.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [adventureId, items, router]);

  if (initialRows.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      <Separator />
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Ordre des énigmes</h3>
        <p className="text-xs text-muted-foreground">
          Ce numéro définit la suite du parcours et l&apos;itinéraire calculé. Utilisez
          les flèches puis enregistrez.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">N°</TableHead>
            <TableHead>Énigme</TableHead>
            <TableHead className="w-[104px] text-right">Déplacer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium tabular-nums">{index + 1}</TableCell>
              <TableCell
                className="max-w-[min(280px,55vw)] truncate"
                title={row.name}
              >
                {row.name}
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={index === 0 || saving}
                    aria-label="Monter"
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={index === items.length - 1 || saving}
                    aria-label="Descendre"
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <GuardedButton
          type="button"
          allowed={caps.adventure.update}
          denyReason="Vous ne pouvez pas modifier le contenu de cette aventure."
          disabled={!dirty || saving}
          onClick={() => void save()}
        >
          {saving ? "Enregistrement…" : "Enregistrer l’ordre"}
        </GuardedButton>
      </div>
    </div>
  );
}
