"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Entry = {
  id: string;
  action: string;
  actorUserId: string;
  targetUserId: string | null;
  payload: unknown;
  createdAt: Date;
  actor: { id: string; email: string; name: string | null };
  target: { id: string; email: string; name: string | null } | null;
};

const ACTION_LABELS: Record<string, string> = {
  "user.role.updated": "Rôle utilisateur modifié",
  "admin.adventure.scope.updated": "Périmètre aventures (fiche utilisateur)",
  "adventure.admin.scope.updated": "Admins assignés à une aventure",
  "adventure.creation_requested": "Demande de création d’aventure",
};

function formatAction(action: string) {
  return ACTION_LABELS[action] ?? action;
}

export function AuditLogTable({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Aucun événement enregistré.
      </p>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Acteur</TableHead>
            <TableHead>Cible</TableHead>
            <TableHead className="min-w-[200px]">Données</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                {new Date(row.createdAt).toLocaleString("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "medium",
                })}
              </TableCell>
              <TableCell className="text-sm">{formatAction(row.action)}</TableCell>
              <TableCell className="text-sm">
                <div className="font-medium">{row.actor.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{row.actor.email}</div>
              </TableCell>
              <TableCell className="text-sm">
                {row.target ? (
                  <>
                    <div className="font-medium">{row.target.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.target.email}</div>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="max-w-md align-top">
                {row.payload == null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <pre className="max-h-32 overflow-auto rounded-md bg-muted/50 p-2 text-xs leading-snug">
                    {JSON.stringify(row.payload, null, 2)}
                  </pre>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
