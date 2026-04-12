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
import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { parseThresholdFromCriteria } from "@/lib/badges/milestone-badge-criteria";
import { listMilestoneBadgesForAdmin } from "./_lib/milestone-badge-queries";
import type { MilestoneBadgeListRow } from "./_lib/milestone-badge-queries";

function milestoneKindLabel(kind: BadgeDefinitionKind): string {
  if (kind === BadgeDefinitionKind.MILESTONE_ADVENTURES) {
    return "Aventures réussies (distinctes)";
  }
  return "Km cumulés (parcours terminés)";
}

function formatCriteriaCell(row: MilestoneBadgeListRow): string {
  const n = parseThresholdFromCriteria(row.kind, row.criteria);
  if (row.kind === BadgeDefinitionKind.MILESTONE_ADVENTURES) {
    return `${n} aventure(s)`;
  }
  return `${n} km`;
}

export default async function BadgesGlobauxPage() {
  const rows = await listMilestoneBadgesForAdmin();
  if (!rows) {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  return (
    <div className="m-8 space-y-6">
      <Card className="h-fit p-5">
        <CardHeader className="flex flex-col gap-2 px-0 pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Badges globaux (paliers)
            </CardTitle>
            <CardDescription className="max-w-2xl">
              Définissez les seuils attribués automatiquement à la fin d’une aventure réussie (voir{" "}
              <code className="rounded bg-muted px-1 text-xs">award-on-finish</code>
              ). Le slug technique est généré à la création à partir du libellé (unicité garantie en base).
            </CardDescription>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/admin-game/dashboard/badges-globaux/create">Nouveau palier</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun badge palier. Créez-en un pour récompenser les joueurs selon le nombre d’aventures
              terminées ou la somme des distances des parcours réussis.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Seuil</TableHead>
                  <TableHead className="text-right tabular-nums">Débloqués</TableHead>
                  <TableHead className="text-right tabular-nums">Ordre</TableHead>
                  <TableHead className="w-24 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.slug}</code>
                    </TableCell>
                    <TableCell className="max-w-[14rem] text-sm">{milestoneKindLabel(r.kind)}</TableCell>
                    <TableCell className="tabular-nums">{formatCriteriaCell(r)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.earnedCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin-game/dashboard/badges-globaux/${r.id}`}>Modifier</Link>
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
