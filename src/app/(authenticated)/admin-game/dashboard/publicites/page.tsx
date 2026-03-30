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
import { listAdvertisementsForAdminTable } from "./_lib/advertisement-admin-queries";

export default async function PublicitesPage() {
  const rows = await listAdvertisementsForAdminTable();
  if (!rows) {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  return (
    <div className="m-8 space-y-6">
      <Card className="h-fit p-5">
        <CardHeader className="flex flex-col gap-2 px-0 pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Publicités</CardTitle>
            <CardDescription className="max-w-xl">
              Campagnes partenaires, ciblage géographique et compteurs d’impressions / clics
              (événements enregistrés via l’API).
            </CardDescription>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/admin-game/dashboard/publicites/create">Nouvelle publicité</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune publicité. Créez-en une pour les afficher dans l’appli (placement + API{" "}
              <code className="rounded bg-muted px-1 text-xs">/api/advertisements</code>).
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="text-right tabular-nums">Impr.</TableHead>
                  <TableHead className="text-right tabular-nums">Clics</TableHead>
                  <TableHead className="w-24 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.advertiserName}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.placement}</code>
                    </TableCell>
                    <TableCell>{r.active ? "Oui" : "Non"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.impressionCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.clickCount}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin-game/dashboard/publicites/${r.id}`}>Modifier</Link>
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
