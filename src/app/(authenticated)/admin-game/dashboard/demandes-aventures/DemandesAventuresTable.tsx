"use client";

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
import { markAdventureCreationRequestTreated } from "../aventures/request-adventure.action";

type RequestRow = {
  id: string;
  message: string | null;
  status: string;
  createdAt: Date;
  requester: {
    id: string;
    email: string;
    name: string | null;
  };
};

export function DemandesAventuresTable({ requests }: { requests: RequestRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleTreated = (id: string) => {
    startTransition(async () => {
      const result = await markAdventureCreationRequestTreated(id);
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
          <TableHead>Demandeur</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell className="whitespace-nowrap text-sm tabular-nums">
              {new Date(req.createdAt).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </TableCell>
            <TableCell>
              <div className="font-medium">{req.requester.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{req.requester.email}</div>
            </TableCell>
            <TableCell className="max-w-md text-sm">
              {req.message ?? (
                <span className="text-muted-foreground">(aucun message)</span>
              )}
            </TableCell>
            <TableCell>
              {req.status === "pending" ? (
                <span className="text-amber-700">En attente</span>
              ) : (
                <span className="text-muted-foreground">Traitée</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              {req.status === "pending" ? (
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
        ))}
      </TableBody>
    </Table>
  );
}
