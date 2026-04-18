import { prisma } from "@/lib/prisma";
import {
  buildBrandEmailHtml,
  escapeHtmlForBrandEmail,
  type BrandEmailBlock,
} from "@/lib/email-brand-template";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { queueTransactionalEmail } from "@/lib/send-transactional-email";

/**
 * Avertit par e-mail tous les comptes superadmin qu’une demande de création d’aventure a été déposée.
 * Échec silencieux (log) pour ne pas bloquer l’enregistrement de la demande.
 */
export async function notifySuperadminsNewAdventureRequest(params: {
  requestId: string;
  requesterName: string | null;
  requesterEmail: string;
  message: string | null;
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
  const listUrl = origin ? `${origin}/admin-game/dashboard/demandes` : null;

  const whoPlain = params.requesterName
    ? `${params.requesterName} (${params.requesterEmail})`
    : params.requesterEmail;
  const whoHtml = params.requesterName
    ? `${escapeHtmlForBrandEmail(params.requesterName)} (${escapeHtmlForBrandEmail(params.requesterEmail)})`
    : escapeHtmlForBrandEmail(params.requesterEmail);

  const msgBlock = params.message
    ? `\n\nMessage :\n${params.message}`
    : "\n\n(Aucun message associé.)";

  const text = `Bonjour,

${whoPlain} a demandé la création d'une nouvelle aventure.

Identifiant de la demande : ${params.requestId}${msgBlock}

${listUrl ? `Voir les demandes : ${listUrl}` : "Connectez-vous au tableau de bord pour voir les demandes."}
`;

  const blocks: BrandEmailBlock[] = [
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:16px;line-height:1.55;"><strong>${whoHtml}</strong> a demandé la <strong>création d'une nouvelle aventure</strong>.</p>`,
    },
    {
      type: "html",
      html: `<p style="margin:0 0 12px;color:#281401;font-size:14px;">Identifiant : <span style="font-family:ui-monospace,monospace;background:#f0ebe3;padding:2px 8px;border-radius:4px;">${escapeHtmlForBrandEmail(params.requestId)}</span></p>`,
    },
    ...(params.message
      ? [{ type: "highlight" as const, title: "Message du demandeur", text: params.message }]
      : [{ type: "p" as const, text: "(Aucun message associé à cette demande.)" }]),
  ];
  if (listUrl) {
    blocks.push({ type: "cta", label: "Ouvrir la liste des demandes", href: listUrl });
  } else {
    blocks.push({
      type: "p",
      text: "Ouvrez le tableau de bord admin pour traiter cette demande.",
    });
  }

  const html = buildBrandEmailHtml({
    preheader: "Nouvelle demande de création d’aventure.",
    headline: "Demande création d’aventure",
    blocks,
  });

  queueTransactionalEmail({
    to,
    subject: "[Balad'indice] Nouvelle demande de création d’aventure",
    text,
    html,
  });
}
