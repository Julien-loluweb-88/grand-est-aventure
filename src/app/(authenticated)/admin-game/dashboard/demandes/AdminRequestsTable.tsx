"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { markAdminRequestClosed } from "../aventures/request-adventure.action";

type RequestRow = {
  id: string;
  message: string | null;
  status: string;
  createdAt: Date;
  payload: unknown;
  requestType: {
    key: string;
    label: string;
  };
  requester: {
    id: string;
    email: string;
    name: string | null;
  };
  adventure: {
    id: string;
    name: string;
  } | null;
};

function quantityFromPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const q = (payload as Record<string, unknown>).quantityRequested;
  return typeof q === "number" && Number.isFinite(q) ? q : null;
}

export function AdminRequestsTable({ requests }: { requests: RequestRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleTreated = (id: string) => {
    startTransition(async () => {
      const result = await markAdminRequestClosed(id);
      if (!result.success) {
        toast.error("error" in result ? result.error : "Erreur.");
        return;
      }
      toast.success("Demande marquée comme traitée.");
      router.refresh();
    });
  };

  if (requests.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Aucune demande pour le moment.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type (key)</TableHead>
          <TableHead>Demandeur</TableHead>
          <TableHead>Aventure</TableHead>
          <TableHead>Détail</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => {
          const qty = quantityFromPayload(req.payload);
          return (
            <TableRow key={req.id}>
              <TableCell className="whitespace-nowrap text-sm tabular-nums">
                {new Date(req.createdAt).toLocaleString("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </TableCell>
              <TableCell>
                <div className="font-medium">{req.requestType.label}</div>
                <div className="text-xs text-muted-foreground">
                  <code>{req.requestType.key}</code>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{req.requester.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{req.requester.email}</div>
              </TableCell>
              <TableCell className="max-w-56 text-sm">
                {req.adventure ? (
                  <Link
                    href={`/admin-game/dashboard/aventures/${req.adventure.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {req.adventure.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="max-w-md text-sm">
                {req.message ? (
                  <span className="whitespace-pre-wrap">{req.message}</span>
                ) : (
                  <span className="text-muted-foreground">(aucun message)</span>
                )}
                {qty != null ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Quantité indicative : {qty}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                {req.status === "PENDING" ? (
                  <span className="text-amber-700">En attente</span>
                ) : (
                  <span className="text-muted-foreground">Traitée</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {req.status === "PENDING" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleTreated(req.id)}
                  >
                    Marquer comme traitée
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
