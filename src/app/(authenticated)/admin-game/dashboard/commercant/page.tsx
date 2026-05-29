import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { PartnerOfferClaimStatus } from "@/lib/badges/prisma-enums";
import { listPartnerClaimsForMerchant } from "@/lib/merchant/list-partner-claims-for-merchant";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MerchantPartnerClaimsPanel } from "./_components/MerchantPartnerClaimsPanel";

export default async function CommercantDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || session.user.role !== "merchant") {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  const initialClaims = await listPartnerClaimsForMerchant(
    session.user.id,
    PartnerOfferClaimStatus.PENDING
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compte commerçant</h1>
        <p className="text-sm text-muted-foreground">
          Validez les demandes d&apos;offres partenaires depuis ce tableau de bord ou depuis
          l&apos;application mobile — même session, mêmes droits.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Demandes d&apos;offres</CardTitle>
          <CardDescription>
            Un super administrateur vous a rattaché à une ou plusieurs campagnes. Vous n&apos;avez
            pas accès aux aventures, aux villes ni aux publicités en dehors de ces demandes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MerchantPartnerClaimsPanel initialClaims={initialClaims} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Aide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Besoin d&apos;aide côté organisation (nouvelle campagne, rattachement compte) ?
            Contactez l&apos;équipe qui gère Balad&apos;indice (comptes admin / superadmin).
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
