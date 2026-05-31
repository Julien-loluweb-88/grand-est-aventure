import Link from "next/link";

import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getMerchantAdvertisementForEdit } from "@/lib/advertisements/merchant-advertisement-queries";

import type { MerchantAdvertisementEditRow } from "@/lib/advertisements/merchant-advertisement-queries";

import {

  MerchantAdvertisementContentForm,

  type MerchantBadgePreview,

} from "../../_components/MerchantAdvertisementContentForm";



function hasPendingContent(ad: MerchantAdvertisementEditRow): boolean {

  return (

    ad.pendingTitle != null ||

    ad.pendingBody != null ||

    ad.pendingImageUrl != null ||

    ad.pendingTargetUrl != null

  );

}



function hasPendingOfferSettings(ad: MerchantAdvertisementEditRow): boolean {

  return (

    ad.pendingPartnerMaxRedemptionsPerUser != null || ad.pendingPartnerClaimsOpen != null

  );

}



function resolvePartnerOfferEnabled(

  ad: MerchantAdvertisementEditRow,

  usePendingOffer: boolean

): boolean {

  if (usePendingOffer) {
    return ad.pendingPartnerMaxRedemptionsPerUser != null;
  }

  return Boolean(
    ad.partnerBadgeDefinitionId &&
      (ad.partnerClaimsOpen || ad.partnerMaxRedemptionsPerUser > 1)
  );

}



function resolveMerchantFormDefaults(ad: MerchantAdvertisementEditRow) {

  const usePendingContent = hasPendingContent(ad);

  const usePendingOffer = hasPendingOfferSettings(ad);



  return {

    title: (usePendingContent ? ad.pendingTitle : ad.title) ?? "",

    body: (usePendingContent ? ad.pendingBody : ad.body) ?? "",

    imageUrl: (usePendingContent ? ad.pendingImageUrl : ad.imageUrl) ?? "",

    targetUrl: (usePendingContent ? ad.pendingTargetUrl : ad.targetUrl) ?? "",

    partnerOfferEnabled: resolvePartnerOfferEnabled(ad, usePendingOffer),

    partnerMaxRedemptionsPerUser:

      (usePendingOffer

        ? ad.pendingPartnerMaxRedemptionsPerUser

        : ad.partnerMaxRedemptionsPerUser) ?? 1,

    partnerClaimsOpen:

      (usePendingOffer ? ad.pendingPartnerClaimsOpen : ad.partnerClaimsOpen) ?? true,

  };

}



function resolveBadgePreview(ad: MerchantAdvertisementEditRow): MerchantBadgePreview {
  const title = ad.partnerBadgeDefinition?.title?.trim() || null;
  const imageUrl = ad.partnerBadgeDefinition?.imageUrl?.trim() || null;
  const badgeConfigured = Boolean(ad.partnerBadgeDefinitionId && (title || imageUrl));

  return {
    badgeTitle: title ?? (badgeConfigured ? ad.name : null),
    badgeImageUrl: imageUrl,
    badgeConfigured,
  };
}



export default async function MerchantPubliciteEditPage({

  params,

}: {

  params: Promise<{ id: string }>;

}) {

  const { id } = await params;

  const result = await getMerchantAdvertisementForEdit(id);



  if (!result.ok) {

    if (result.reason === "auth") redirect("/admin-game/dashboard/acces-refuse");

    notFound();

  }



  const ad = result.data;



  return (

    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

      <Link

        href="/admin-game/dashboard/commercant/publicites"

        className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"

      >

        ← Mes publicités

      </Link>

      <Card>

        <CardHeader>

          <CardTitle className="text-xl font-semibold">Contenu publicitaire</CardTitle>

          <CardDescription className="max-w-2xl">

            Promos dans le contenu pub ; nom du badge fixe par l&apos;équipe Balad&apos;indice.

          </CardDescription>

        </CardHeader>

        <CardContent>

          <MerchantAdvertisementContentForm

            advertisementId={ad.id}

            advertisementName={ad.name}

            advertiserName={ad.advertiserName}

            status={ad.merchantContentStatus}

            rejectionReason={ad.merchantRejectionReason}

            badgePreview={resolveBadgePreview(ad)}

            defaultValues={resolveMerchantFormDefaults(ad)}

          />

        </CardContent>

      </Card>

    </div>

  );

}


