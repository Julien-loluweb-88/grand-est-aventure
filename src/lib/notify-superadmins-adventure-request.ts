import { prisma } from "@/lib/prisma";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { getAppMailTransport } from "@/lib/smtp-transport";

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
  const listUrl = origin
    ? `${origin}/admin-game/dashboard/demandes`
    : "/admin-game/dashboard/demandes";

  const who = params.requesterName
    ? `${params.requesterName} (${params.requesterEmail})`
    : params.requesterEmail;
  const msgBlock = params.message
    ? `\n\nMessage :\n${params.message}`
    : "\n\n(Aucun message associé.)";

  const text = `Bonjour,

${who} a demandé la création d'une nouvelle aventure.

Identifiant de la demande : ${params.requestId}${msgBlock}

Voir les demandes : ${listUrl}
`;

  const html = `<p>Bonjour,</p>
<p><strong>${who}</strong> a demandé la création d'une nouvelle aventure.</p>
<p>Identifiant de la demande : <code>${params.requestId}</code></p>
${params.message ? `<p><strong>Message :</strong></p><pre style="white-space:pre-wrap">${escapeHtml(params.message)}</pre>` : "<p><em>Aucun message associé.</em></p>"}
<p><a href="${listUrl}">Ouvrir la liste des demandes</a></p>`;

  await transport.sendMail({
    from,
    to: to.join(", "),
    subject: "[Balad'indice] Nouvelle demande de création d’aventure",
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
