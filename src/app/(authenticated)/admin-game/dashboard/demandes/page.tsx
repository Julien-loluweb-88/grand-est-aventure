import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import {
  listAdminRequestTypes,
  listAdminRequests,
} from "../aventures/request-adventure.action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminRequestsTable } from "./AdminRequestsTable";
import { AdminRequestTypeCreateForm } from "./AdminRequestTypeCreateForm";

export default async function DemandesPage() {
  const result = await listAdminRequests();
  const typesResult = await listAdminRequestTypes();

  if (!result.ok || !typesResult.ok) {
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
            Toutes les demandes
          </CardTitle>
          <CardDescription>
            Création d&apos;aventure, réassort de badges physiques, et tout autre flux
            enregistré ici. Traitez chaque ligne puis clôturez la demande lorsque c&apos;est
            fait.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminRequestsTable requests={result.requests} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Types de demandes (configurables)
          </CardTitle>
          <CardDescription>
            La <strong>key</strong> est l’identifiant technique unique d’un type de demande
            (ex: <code>adventure_creation</code>, <code>badge_restock</code>). Elle sert au
            routage applicatif et aux intégrations ; elle doit donc être stable après création.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Libellé</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {typesResult.types.map((type) => (
                  <tr key={type.id} className="border-t">
                    <td className="px-3 py-2">
                      <code>{type.key}</code>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{type.label}</div>
                      {type.description ? (
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      {type.isActive ? (
                        <span className="text-emerald-700">Actif</span>
                      ) : (
                        <span className="text-muted-foreground">Inactif</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-1 text-base font-medium">Créer un nouveau type</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Conseil : choisissez une key explicite et pérenne. Le libellé pourra évoluer,
              mais la key doit rester identique.
            </p>
            <AdminRequestTypeCreateForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
