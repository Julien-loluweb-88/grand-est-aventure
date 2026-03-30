"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PendingBadgeRestockRequestRow } from "../_lib/badge-restock-request-queries";
import { closeBadgeRestockRequest } from "../_lib/badge-restock-request.action";

export function AdventureAdminPendingBadgeRestockList({
  adventureId,
  initialPending,
}: {
  adventureId: string;
  initialPending: PendingBadgeRestockRequestRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [closingId, setClosingId] = useState<string | null>(null);

  if (initialPending.length === 0) {
    return null;
  }

  const onClose = (requestId: string) => {
    setClosingId(requestId);
    startTransition(async () => {
      try {
        const r = await closeBadgeRestockRequest(adventureId, requestId);
        if (r.success) {
          toast.success("Demande marquée comme traitée.");
          router.refresh();
        } else {
          toast.error(r.error);
        }
      } finally {
        setClosingId(null);
      }
    });
  };

  return (
    <Card className="border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle>Demandes de réassort en attente</CardTitle>
        <CardDescription>
          Traitées côté stock dans la section ci-dessous, puis marquez la demande
          comme traitée ici.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {initialPending.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium">{row.requesterLabel}</p>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={row.createdAt}
                >
                  {new Date(row.createdAt).toLocaleString("fr-FR")}
                </time>
                {row.quantityRequested != null ? (
                  <p className="text-sm text-muted-foreground">
                    Quantité indicative : {row.quantityRequested}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-sm">{row.message}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
                disabled={closingId === row.id}
                onClick={() => onClose(row.id)}
              >
                {closingId === row.id ? "…" : "Marquer comme traitée"}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
