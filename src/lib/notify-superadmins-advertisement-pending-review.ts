import { prisma } from "@/lib/prisma";
import {
  buildBrandEmailHtml,
  escapeHtmlForBrandEmail,
  type BrandEmailBlock,
} from "@/lib/email-brand-template";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { queueTransactionalEmail } from "@/lib/send-transactional-email";

/** Avertit les superadmin qu’un commerçant a soumis une publicité pour validation. */
export async function notifySuperadminsAdvertisementPendingReview(params: {
  advertisementId: string;
  advertisementName: string;
  merchantName: string | null;
  merchantEmail: string;
}): Promise<void> {
  const recipients = await prisma.user.findMany({
    where: { role: "superadmin" },
    select: { email: true },
  });
  const to = recipients.map((r) => r.email).filter((e): e is string => Boolean(e));
  if (to.length === 0) {
    return;
  }

  const origin = getPublicAppOrigin();
  const reviewPath = `/admin-game/dashboard/publicites/${params.advertisementId}`;
  const reviewUrl = origin ? `${origin}${reviewPath}` : null;

  const whoPlain = params.merchantName
    ? `${params.merchantName} (${params.merchantEmail})`
    : params.merchantEmail;
  const whoHtml = params.merchantName
    ? `${escapeHtmlForBrandEmail(params.merchantName)} (${escapeHtmlForBrandEmail(params.merchantEmail)})`
    : escapeHtmlForBrandEmail(params.merchantEmail);

  const text = `Bonjour,

${whoPlain} a soumis une publicité pour validation.

Campagne : ${params.advertisementName}
Identifiant : ${params.advertisementId}

${reviewUrl ? `Valider ou refuser : ${reviewUrl}` : "Connectez-vous au tableau de bord publicités."}
`;

  const blocks: BrandEmailBlock[] = [
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:16px;line-height:1.55;"><strong>${whoHtml}</strong> a soumis une publicité pour <strong>validation</strong>.</p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:14px;">Campagne : <strong>${escapeHtmlForBrandEmail(params.advertisementName)}</strong></p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:14px;">Identifiant : <span style="font-family:ui-monospace,monospace;background:#f0ebe3;padding:2px 8px;border-radius:4px;">${escapeHtmlForBrandEmail(params.advertisementId)}</span></p>`,
    },
  ];
  if (reviewUrl) {
    blocks.push({ type: "cta", label: "Ouvrir la fiche publicité", href: reviewUrl });
  }

  const html = buildBrandEmailHtml({
    preheader: "Publicité commerçant en attente de validation.",
    headline: "Validation publicité commerçant",
    blocks,
  });

  queueTransactionalEmail({
    to,
    subject: "[Balad'indice] Publicité commerçant à valider",
    text,
    html,
  });
}
