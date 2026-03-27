import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { listAdminAuditLogs } from "./audit-log.action";
import { AuditLogTable } from "./AuditLogTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function JournalAdminPage() {
  const result = await listAdminAuditLogs();

  if (!result.ok) {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <Link
        href="/admin-game/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour au tableau de bord
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Journal d’audit admin
          </CardTitle>
          <CardDescription>
            Historique des actions sensibles (rôles, périmètres d’aventures, demandes de création).
            Réservé au super administrateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable entries={result.entries} />
        </CardContent>
      </Card>
    </div>
  );
}
