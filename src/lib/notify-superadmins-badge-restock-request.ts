import { prisma } from "@/lib/prisma";
import {
  buildBrandEmailHtml,
  escapeHtmlForBrandEmail,
  type BrandEmailBlock,
} from "@/lib/email-brand-template";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { queueTransactionalEmail } from "@/lib/send-transactional-email";

/**
 * Avertit les superadmin qu’un admin a demandé un réapprovisionnement de badges physiques.
 */
export async function notifySuperadminsBadgeRestockRequest(params: {
  adventureId: string;
  adventureName: string;
  requestId: string;
  requesterName: string | null;
  requesterEmail: string;
  message: string;
  quantityRequested: number | null;
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
  const adventurePath = `/admin-game/dashboard/aventures/${params.adventureId}`;
  const adventureUrl = origin ? `${origin}${adventurePath}` : null;
  const demandesUrl = origin ? `${origin}/admin-game/dashboard/demandes` : null;

  const whoPlain = params.requesterName
    ? `${params.requesterName} (${params.requesterEmail})`
    : params.requesterEmail;
  const whoHtml = params.requesterName
    ? `${escapeHtmlForBrandEmail(params.requesterName)} (${escapeHtmlForBrandEmail(params.requesterEmail)})`
    : escapeHtmlForBrandEmail(params.requesterEmail);

  const qty =
    params.quantityRequested != null
      ? `\nQuantité souhaitée (indicative) : ${params.quantityRequested}`
      : "";

  const text = `Bonjour,

${whoPlain} a demandé un réapprovisionnement de badges physiques pour l’aventure « ${params.adventureName} ».

Identifiant de la demande : ${params.requestId}
${qty}

Message :
${params.message}

${adventureUrl ? `Fiche aventure : ${adventureUrl}` : `Fiche : ${adventurePath}`}
${demandesUrl ? `\nDemandes : ${demandesUrl}` : ""}
`;

  const blocks: BrandEmailBlock[] = [
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:16px;line-height:1.55;"><strong>${whoHtml}</strong> demande un <strong>réapprovisionnement de badges</strong> pour l’aventure « <strong>${escapeHtmlForBrandEmail(params.adventureName)}</strong> ».</p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:14px;">Identifiant : <span style="font-family:ui-monospace,monospace;background:#f0ebe3;padding:2px 8px;border-radius:4px;">${escapeHtmlForBrandEmail(params.requestId)}</span></p>`,
    },
  ];
  if (params.quantityRequested != null) {
    blocks.push({
      type: "p",
      text: `Quantité souhaitée (indicative) : ${params.quantityRequested}`,
    });
  }
  blocks.push(
    { type: "highlight", title: "Message", text: params.message },
    ...(adventureUrl && demandesUrl
      ? ([
          { type: "cta" as const, label: "Ouvrir la fiche aventure", href: adventureUrl },
          { type: "cta" as const, label: "Liste des demandes", href: demandesUrl },
        ] as BrandEmailBlock[])
      : [
          {
            type: "p" as const,
            text: "Ouvrez le tableau de bord admin pour traiter cette demande.",
          },
        ])
  );

  const html = buildBrandEmailHtml({
    preheader: `Réassort badges — ${params.adventureName}`,
    headline: "Demande de réassort de badges",
    blocks,
  });

  queueTransactionalEmail({
    to,
    subject: `[Balad'indice] Demande de réassort badges — ${params.adventureName}`,
    text,
    html,
  });
}
