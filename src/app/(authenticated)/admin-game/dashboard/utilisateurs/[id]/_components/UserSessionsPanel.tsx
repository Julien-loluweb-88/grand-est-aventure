"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  revokeAllTargetUserSessions,
  revokeTargetUserSession,
} from "../_lib/user.action";
import type { UserSessionRow } from "../_lib/user-queries";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatSessionDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function UserSessionsPanel({
  userId,
  rows,
}: {
  userId: string;
  rows: UserSessionRow[];
}) {
  const caps = useAdminCapabilities();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canList = caps.session.list;
  const canRevoke = caps.session.revoke;

  if (!canList) {
    return (
      <p className="text-sm text-muted-foreground">
        Vous ne pouvez pas consulter les sessions.
      </p>
    );
  }

  const handleRevokeOne = (sessionId: string) => {
    startTransition(async () => {
      const result = await revokeTargetUserSession(userId, sessionId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleRevokeAll = () => {
    startTransition(async () => {
      const result = await revokeAllTargetUserSessions(userId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canRevoke ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending || rows.length === 0}
            onClick={handleRevokeAll}
          >
            Révoquer toutes les sessions
          </Button>
        ) : (
          <GuardedButton
            type="button"
            variant="destructive"
            size="sm"
            allowed={false}
            denyReason="Révocation réservée au super admin."
          >
            Révoquer toutes les sessions
          </GuardedButton>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune session active.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Créée</TableHead>
              <TableHead>Expire</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Appareil</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatSessionDate(s.createdAt)}
                  {s.isCurrent ? (
                    <span className="ml-2 text-xs font-medium text-foreground">(vous)</span>
                  ) : null}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatSessionDate(s.expiresAt)}
                </TableCell>
                <TableCell className="max-w-[120px] truncate text-muted-foreground">
                  {s.ipAddress ?? "—"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {s.userAgent ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {canRevoke ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRevokeOne(s.id)}
                    >
                      Révoquer
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
