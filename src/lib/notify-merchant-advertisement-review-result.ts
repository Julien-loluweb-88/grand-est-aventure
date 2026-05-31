import {
  buildBrandEmailHtml,
  escapeHtmlForBrandEmail,
  type BrandEmailBlock,
} from "@/lib/email-brand-template";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { queueTransactionalEmail } from "@/lib/send-transactional-email";

export function queueMerchantAdvertisementApprovedEmail(params: {
  to: string;
  displayName: string | null;
  advertisementName: string;
  advertisementId: string;
}): void {
  const origin = getPublicAppOrigin();
  const greet = params.displayName
    ? `Bonjour ${params.displayName},`
    : "Bonjour,";
  const editPath = `/admin-game/dashboard/commercant/publicites/${params.advertisementId}`;
  const editUrl = origin ? `${origin}${editPath}` : editPath;

  const text = `${greet}

Votre publicité « ${params.advertisementName} » a été validée et est en ligne (selon les dates de campagne définies par l'équipe).

${origin ? `Voir votre espace commerçant : ${editUrl}` : "Connectez-vous à votre espace commerçant."}

— Balad'indice`;

  const blocks: BrandEmailBlock[] = [
    {
      type: "html",
      html: `<p style="margin:0 0 16px;color:#281401;font-size:16px;line-height:1.55;">${escapeHtmlForBrandEmail(greet)}</p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:16px;line-height:1.55;">Votre publicité <strong>${escapeHtmlForBrandEmail(params.advertisementName)}</strong> a été <strong>validée</strong> et est en ligne (selon les dates de campagne).</p>`,
    },
  ];
  if (origin) {
    blocks.push({ type: "cta", label: "Ouvrir mon espace commerçant", href: editUrl });
  }

  const html = buildBrandEmailHtml({
    preheader: "Votre publicité a été validée.",
    headline: "Publicité validée",
    blocks,
  });

  queueTransactionalEmail({
    to: params.to,
    subject: "[Balad'indice] Votre publicité a été validée",
    text,
    html,
  });
}

export function queueMerchantAdvertisementRejectedEmail(params: {
  to: string;
  displayName: string | null;
  advertisementName: string;
  advertisementId: string;
  rejectionReason: string;
}): void {
  const origin = getPublicAppOrigin();
  const greet = params.displayName
    ? `Bonjour ${params.displayName},`
    : "Bonjour,";
  const editPath = `/admin-game/dashboard/commercant/publicites/${params.advertisementId}`;
  const editUrl = origin ? `${origin}${editPath}` : editPath;

  const text = `${greet}

Votre publicité « ${params.advertisementName} » n'a pas été validée.

Motif :
${params.rejectionReason}

Vous pouvez corriger et soumettre à nouveau depuis votre espace commerçant.
${origin ? editUrl : ""}

— Balad'indice`;

  const blocks: BrandEmailBlock[] = [
    {
      type: "html",
      html: `<p style="margin:0 0 16px;color:#281401;font-size:16px;line-height:1.55;">${escapeHtmlForBrandEmail(greet)}</p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:16px;line-height:1.55;">Votre publicité <strong>${escapeHtmlForBrandEmail(params.advertisementName)}</strong> n'a pas été validée.</p>`,
    },
    {
      type: "highlight",
      title: "Motif du refus",
      text: params.rejectionReason,
    },
  ];
  if (origin) {
    blocks.push({ type: "cta", label: "Corriger ma publicité", href: editUrl });
  }

  const html = buildBrandEmailHtml({
    preheader: "Votre publicité nécessite des corrections.",
    headline: "Publicité refusée",
    blocks,
  });

  queueTransactionalEmail({
    to: params.to,
    subject: "[Balad'indice] Votre publicité nécessite des corrections",
    text,
    html,
  });
}
