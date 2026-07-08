import "server-only";

import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/send-transactional-email";
import { buildTrackedCampaignHtml } from "@/lib/email-campaign-tracking";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { getBaladIndicesPdfAttachments } from "@/lib/email-campaign-attachments";
import { logProspectEmailBounce, logProspectEmailSent } from "@/lib/prospect-events";
import { DEFAULT_PROSPECT_CONTACT_NAME } from "@/lib/prospect-events-constants";
import { isPermanentEmailBounceError } from "@/lib/email-bounce";
import { getProspectContactEmail } from "@/lib/prospect-contact-email";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 1000;

const campaignAttachments = getBaladIndicesPdfAttachments();

export function substituteTemplateVars(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Envoie une campagne à tous ses destinataires par petits lots séquentiels,
 * pour ne pas saturer le SMTP. Met à jour le statut de chaque destinataire
 * et de la campagne au fur et à mesure.
 */
export async function runEmailCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: {
      recipients: {
        where: { status: "PENDING" },
        include: {
          prospect: {
            include: {
              owner: { select: { email: true } },
            },
          },
        },
      },
    },
  });
  if (!campaign) return;

  for (let i = 0; i < campaign.recipients.length; i += BATCH_SIZE) {
    const batch = campaign.recipients.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (recipient) => {
        try {
          if (recipient.prospect?.status === "UNSUBSCRIBED") {
            await prisma.emailCampaignRecipient.update({
              where: { id: recipient.id },
              data: {
                status: "FAILED",
                error: "Destinataire désinscrit.",
              },
            });
            await prisma.emailCampaign.update({
              where: { id: campaignId },
              data: { failedCount: { increment: 1 } },
            });
            return;
          }

          const replyEmail = getProspectContactEmail(recipient.prospect?.owner?.email);
          const contactName =
            recipient.prospect?.contactName?.trim() || DEFAULT_PROSPECT_CONTACT_NAME;
          const communeForSubject = recipient.prospect?.commune?.trim() || "votre commune";
          const intercommunaliteForText = recipient.prospect?.intercommunalite?.trim() || "";
          const origin = getPublicAppOrigin();
          const base = origin ? origin.replace(/\/$/, "") : "";
          const unsubscribeUrl =
            recipient.prospect?.unsubscribeToken
              ? `${base}/api/email/unsubscribe?token=${encodeURIComponent(
                  recipient.prospect.unsubscribeToken
                )}`
              : "";

          const templateVars = {
            commune: communeForSubject,
            intercommunalite: intercommunaliteForText,
            contact_name: contactName,
            reply_email: replyEmail,
            communes_url: `${base}/communes`,
            unsubscribe_url: unsubscribeUrl,
          };

          const trackedHtml = buildTrackedCampaignHtml({
            html: substituteTemplateVars(campaign.html, templateVars),
            trackingToken: recipient.trackingToken,
            unsubscribeToken: recipient.prospect?.unsubscribeToken,
          });

          const subject = substituteTemplateVars(campaign.subject, templateVars);

          const text = substituteTemplateVars(campaign.text, templateVars);

          await sendTransactionalEmail({
            to: recipient.email,
            subject,
            text,
            html: trackedHtml,
            replyTo: replyEmail || undefined,
            attachments: campaignAttachments ?? undefined,
          });
          await prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "SENT", sentAt: new Date() },
          });
          await prisma.emailCampaign.update({
            where: { id: campaignId },
            data: { sentCount: { increment: 1 } },
          });
          if (recipient.prospectId) {
            await prisma.prospect.update({
              where: { id: recipient.prospectId },
              data: { lastContactedAt: new Date() },
            });
            await logProspectEmailSent({
              prospectId: recipient.prospectId,
              sequenceStep: recipient.sequenceStep,
            });
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
          await prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              error: errorMessage,
            },
          });
          await prisma.emailCampaign.update({
            where: { id: campaignId },
            data: { failedCount: { increment: 1 } },
          });
          if (recipient.prospectId) {
            if (isPermanentEmailBounceError(errorMessage)) {
              await logProspectEmailBounce({
                prospectId: recipient.prospectId,
                details: errorMessage,
              });
            }
          }
        }
      })
    );

    if (i + BATCH_SIZE < campaign.recipients.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENT" },
  });
}