import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatGlobalBadgeRuleSummary,
  GLOBAL_BADGE_KIND_META,
  isAdminGlobalBadgeKind,
} from "@/lib/badges/global-badge-metadata";
import { listGlobalBadgesForAdmin } from "./_lib/global-badge-queries";
import type { GlobalBadgeListRow } from "./_lib/global-badge-queries";

function kindLabel(row: GlobalBadgeListRow): string {
  if (isAdminGlobalBadgeKind(row.kind)) {
    return GLOBAL_BADGE_KIND_META[row.kind].label;
  }
  return row.kind;
}

function triggerLabel(row: GlobalBadgeListRow): string {
  if (isAdminGlobalBadgeKind(row.kind)) {
    return GLOBAL_BADGE_KIND_META[row.kind].triggerLabel;
  }
  return "—";
}

export default async function BadgesGlobauxPage() {
  const rows = await listGlobalBadgesForAdmin();
  if (!rows) {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  return (
    <div className="m-8 space-y-6">
      <Card className="h-fit p-5">
        <CardHeader className="flex flex-col gap-2 px-0 pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Badges globaux</CardTitle>
            <CardDescription className="max-w-3xl space-y-2">
              <p>
                Paliers (parcours, km), performances et règles spéciales. Chaque ligne décrit{" "}
                <strong>quand</strong> le joueur reçoit le badge ; une fois obtenu, il reste dans
                sa collection.
              </p>
              <p className="text-xs">
                Moteur : évaluation à la <strong>fin d’un parcours réussi</strong>, sauf « marcheur
                du mois » (tâche cron le 1<sup>er</sup> du mois —{" "}
                <code className="rounded bg-muted px-1">GET /api/cron/award-monthly-km-badges</code>
                ).
              </p>
            </CardDescription>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/admin-game/dashboard/badges-globaux/create">Nouveau badge global</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun badge global. Créez des paliers (ex. 5 parcours, 30 km), assiduité, marcheur
              du mois ou nocturne.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Type de règle</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Déclencheur</TableHead>
                  <TableHead className="text-right tabular-nums">Débloqués</TableHead>
                  <TableHead className="text-right tabular-nums">Ordre</TableHead>
                  <TableHead className="w-24 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="max-w-[12rem] text-sm">{kindLabel(r)}</TableCell>
                    <TableCell className="text-sm">
                      {formatGlobalBadgeRuleSummary(r.kind, r.criteria)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {triggerLabel(r)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.earnedCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin-game/dashboard/badges-globaux/${r.id}`}>
                          Modifier
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
