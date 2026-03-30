import { prisma } from "@/lib/prisma";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { getAppMailTransport } from "@/lib/smtp-transport";

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
  const transport = getAppMailTransport();
  const from = process.env.NODEMAILER_USER?.trim();
  if (!transport || !from) {
    return;
  }

  const recipients = await prisma.user.findMany({
    where: { role: "superadmin" },
    select: { email: true },
  });
  const to = recipients.map((r) => r.email).filter((e) => Boolean(e));
  if (to.length === 0) {
    return;
  }

  const origin = getPublicAppOrigin();
  const adventureUrl = origin
    ? `${origin}/admin-game/dashboard/aventures/${params.adventureId}`
    : `/admin-game/dashboard/aventures/${params.adventureId}`;
  const demandesUrl = origin
    ? `${origin}/admin-game/dashboard/demandes`
    : `/admin-game/dashboard/demandes`;

  const who = params.requesterName
    ? `${params.requesterName} (${params.requesterEmail})`
    : params.requesterEmail;
  const qty =
    params.quantityRequested != null
      ? `\nQuantité souhaitée (indicative) : ${params.quantityRequested}`
      : "";

  const text = `Bonjour,

${who} a demandé un réapprovisionnement de badges physiques pour l’aventure « ${params.adventureName} ».

Identifiant de la demande : ${params.requestId}
${qty}

Message :
${params.message}

Ouvrir la fiche aventure : ${adventureUrl}

Toutes les demandes : ${demandesUrl}
`;

  const html = `<p>Bonjour,</p>
<p><strong>${escapeHtml(who)}</strong> demande un réapprovisionnement de badges pour l’aventure <strong>${escapeHtml(params.adventureName)}</strong>.</p>
<p>Identifiant de la demande : <code>${escapeHtml(params.requestId)}</code></p>
${params.quantityRequested != null ? `<p>Quantité souhaitée (indicative) : <strong>${params.quantityRequested}</strong></p>` : ""}
<p><strong>Message :</strong></p><pre style="white-space:pre-wrap">${escapeHtml(params.message)}</pre>
<p><a href="${escapeHtml(adventureUrl)}">Ouvrir la fiche aventure</a></p>
<p><a href="${escapeHtml(demandesUrl)}">Voir toutes les demandes</a></p>`;

  await transport.sendMail({
    from,
    to: to.join(", "),
    subject: `[Balad'indice] Demande de réassort badges — ${params.adventureName}`,
    text,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
