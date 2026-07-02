import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HelpCircle, Megaphone } from "lucide-react";
import { listMerchantOwnedAdvertisements } from "@/lib/advertisements/merchant-advertisement-queries";
import { labelForAdvertisementPlacement } from "@/lib/advertisements/advertisement-placements";
import {
  MerchantFormGuide,
  MerchantStatusBadge,
} from "../_components/MerchantFormLayout";

export default async function MerchantPublicitesPage() {
  const rows = await listMerchantOwnedAdvertisements();
  if (!rows) {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <Link
          href="/admin-game/dashboard/commercant"
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          ← Compte commerçant
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Mes publicités
        </h1>
      </div>

      <MerchantFormGuide icon={HelpCircle} title="Votre rôle">
        <p>
          Remplissez le contenu de chaque emplacement (pub obligatoire, gain optionnel), puis
          soumettez pour validation.
        </p>
      </MerchantFormGuide>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/40">
          <div className="flex items-center gap-2">
            <Megaphone className="size-4 text-primary" aria-hidden />
            <CardTitle className="text-base font-semibold">Emplacements</CardTitle>
          </div>
          <CardDescription className="max-w-2xl">
            Une ligne = un emplacement réservé pour votre enseigne.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun emplacement pour le moment. Contactez l&apos;équipe pour en obtenir.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campagne</TableHead>
                  <TableHead>Enseigne</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.advertiserName}</TableCell>
                    <TableCell>{labelForAdvertisementPlacement(r.placement)}</TableCell>
                    <TableCell>
                      <MerchantStatusBadge status={r.merchantContentStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin-game/dashboard/commercant/publicites/${r.id}`}>
                          {r.merchantContentStatus === "SLOT_EMPTY" ? "Remplir" : "Modifier"}
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
