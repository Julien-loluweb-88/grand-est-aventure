import Link from "next/link";
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
import { listCitiesForAdminTable } from "./_lib/city-queries";
import { CityAdventuresCountModal } from "./_components/CityAdventuresCountModal";

export default async function VillesPage() {
  const rows = await listCitiesForAdminTable();

  return (
    <div className="m-8 space-y-6">
      <Card className="h-fit p-5">
        <CardHeader className="flex flex-col gap-2 px-0 pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Villes</CardTitle>
            <CardDescription className="max-w-xl">
              Référentiel lieux utilisé par les aventures. Créez ou modifiez une ville ici,
              puis sélectionnez-la sur chaque aventure.
            </CardDescription>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/admin-game/dashboard/villes/create">Nouvelle ville</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ville. Créez-en une pour lier une aventure.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>INSEE</TableHead>
                  <TableHead className="text-right">Aventures</TableHead>
                  <TableHead className="w-24 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {r.inseeCode ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <CityAdventuresCountModal
                        cityId={r.id}
                        cityName={r.name}
                        count={r._count.adventures}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin-game/dashboard/villes/${r.id}`}>Modifier</Link>
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
