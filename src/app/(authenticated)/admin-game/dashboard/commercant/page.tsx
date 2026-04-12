import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CommercantDashboardPage() {
  return (
    <div className="m-8 max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">Compte commerçant</CardTitle>
          <CardDescription>
            Les validations d’offres partenaires se font depuis l’application mobile, avec la même
            session que sur ce site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Ce tableau de bord est volontairement limité : vous n’avez pas accès aux aventures, aux
            villes ni aux publicités. Un super administrateur vous a rattaché à une ou plusieurs
            campagnes ; vous traitez les demandes des joueurs dans l’app.
          </p>
          <div className="rounded-md border border-border bg-muted/40 p-4 font-mono text-xs text-foreground">
            <p className="mb-2 font-sans text-sm font-medium text-foreground">API (référence)</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <code>GET /api/merchant/partner-claims</code> — file des demandes
              </li>
              <li>
                <code>{`POST /api/merchant/partner-claims/{id}/resolve`}</code> — approuver ou refuser
              </li>
            </ul>
          </div>
          <p>
            Besoin d’aide côté organisation ? Contactez l’équipe qui gère Balad&apos;indice (comptes{" "}
            <span className="text-foreground">admin</span> / <span className="text-foreground">superadmin</span>
            ).
          </p>
          <p>
            <Link
              href="/admin-game/dashboard/parametres"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Paramètres du compte
            </Link>{" "}
            (mot de passe, etc.) restent disponibles depuis le menu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
