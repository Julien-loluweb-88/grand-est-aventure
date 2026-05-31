import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClipboardCheck, HelpCircle, Megaphone } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { MerchantPartnerClaimsPanel } from "./_components/MerchantPartnerClaimsPanel";
import { MerchantFormGuide } from "./_components/MerchantFormLayout";

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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Compte commerçant
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Gérez vos publicités et validez les demandes des joueurs.
        </p>
      </div>

      <Card className="overflow-hidden border-sky-200 dark:border-sky-900">
        <CardHeader className="border-b border-sky-100 bg-sky-50/80 dark:border-sky-900 dark:bg-sky-950/30">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-sky-600 dark:text-sky-400" aria-hidden />
            <CardTitle className="text-base font-semibold text-sky-950 dark:text-sky-100">
              Demandes d&apos;offres
            </CardTitle>
          </div>
          <CardDescription className="max-w-2xl text-sky-900/70 dark:text-sky-200/70">
            Approuvez ou refusez les joueurs qui réclament votre gain après visite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MerchantPartnerClaimsPanel initialClaims={initialClaims} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/40">
          <div className="flex items-center gap-2">
            <Megaphone className="size-4 text-primary" aria-hidden />
            <CardTitle className="text-base font-semibold">Publicités</CardTitle>
          </div>
          <CardDescription className="max-w-2xl">
            Remplissez vos emplacements (pub + gain optionnel) et soumettez-les pour validation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin-game/dashboard/commercant/publicites">Mes publicités</Link>
          </Button>
        </CardContent>
      </Card>

      <MerchantFormGuide icon={HelpCircle} title="Besoin d'aide ?">
        <ul className="list-disc space-y-1 pl-4">
          <li>
            <strong>Publicités</strong> — contenu de campagne, validation par Balad&apos;indice.
          </li>
          <li>
            <strong>Demandes</strong> — validation des gains joueurs en caisse.
          </li>
          <li>
            Nouvel emplacement ou question ? Contactez l&apos;équipe admin.
          </li>
        </ul>
        <p className="pt-1">
          <Link
            href="/admin-game/dashboard/parametres"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Paramètres du compte
          </Link>
        </p>
      </MerchantFormGuide>
    </div>
  );
}
