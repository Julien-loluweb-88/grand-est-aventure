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
import { listAvatarsForAdmin } from "./_lib/avatar-admin-queries";

export default async function AvatarsAdminPage() {
  const rows = await listAvatarsForAdmin();
  if (!rows) {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  return (
    <div className="m-8 space-y-6">
      <Card className="h-fit p-5">
        <CardHeader className="flex flex-col gap-2 px-0 pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Avatars compagnons</CardTitle>
            <CardDescription className="max-w-2xl">
              Métadonnées visibles par l’app (`GET /api/game/avatars`). Téléversez une **vignette** et
              optionnellement un **fichier .glb** : l’app peut l’utiliser à la place du modèle embarqué
              (même <code className="rounded bg-muted px-1 text-xs">slug</code> pour le repli local).
            </CardDescription>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/admin-game/dashboard/avatars/create">Nouvel avatar</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun avatar en base.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Actif</TableHead>
                  <TableHead className="text-center">Vignette</TableHead>
                  <TableHead className="text-center">Modèle</TableHead>
                  <TableHead className="text-right tabular-nums">Joueurs</TableHead>
                  <TableHead className="text-right tabular-nums">Ordre</TableHead>
                  <TableHead className="w-24 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.slug}</code>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {r.isActive ? (
                        <span className="rounded-md bg-secondary px-2 py-0.5">oui</span>
                      ) : (
                        <span className="text-muted-foreground">non</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {r.thumbnailUrl ? "oui" : "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {r.modelUrl ? "oui" : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.selectedByUserCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin-game/dashboard/avatars/${r.id}`}>Modifier</Link>
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
