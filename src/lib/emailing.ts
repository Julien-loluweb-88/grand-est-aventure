import "server-only";

import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/send-transactional-email";
import { buildTrackedCampaignHtml } from "@/lib/email-campaign-tracking";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { getBaladIndicesPdfAttachments } from "@/lib/email-campaign-attachments";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 1000;

const campaignAttachments = getBaladIndicesPdfAttachments();

function substituteTemplateVars(template: string, vars: Record<string, string>) {
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
        include: { prospect: true },
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

          const replyEmail = process.env.NODEMAILER_USER?.trim() ?? "";
          const contactName = "Madame, Monsieur";
          const communeForSubject = recipient.prospect?.commune?.trim() || "votre commune";
          const intercommunaliteForText = recipient.prospect?.intercommunalite?.trim() || "";
          const origin = getPublicAppOrigin();
          const unsubscribeUrl =
            recipient.prospect?.unsubscribeToken
              ? `${origin ? origin.replace(/\/$/, "") : ""}/api/email/unsubscribe?token=${encodeURIComponent(
                  recipient.prospect.unsubscribeToken
                )}`
              : "";

          const trackedHtml = buildTrackedCampaignHtml({
            html: substituteTemplateVars(campaign.html, {
              commune: communeForSubject,
              intercommunalite: intercommunaliteForText,
              contact_name: contactName,
              reply_email: replyEmail,
              unsubscribe_url: unsubscribeUrl,
            }),
            trackingToken: recipient.trackingToken,
            unsubscribeToken: recipient.prospect?.unsubscribeToken,
          });

          const subject = substituteTemplateVars(campaign.subject, {
            commune: communeForSubject,
            intercommunalite: intercommunaliteForText,
            contact_name: contactName,
            reply_email: replyEmail,
            unsubscribe_url: "",
          });

          const text = substituteTemplateVars(campaign.text, {
            commune: communeForSubject,
            intercommunalite: intercommunaliteForText,
            contact_name: contactName,
            reply_email: replyEmail,
            unsubscribe_url: unsubscribeUrl,
          });

          await sendTransactionalEmail({
            to: recipient.email,
            subject,
            text,
            html: trackedHtml,
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
              data: {
                lastContactedAt: new Date(),
                nextFollowUpAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
              },
            });
          }
        } catch (err) {
          await prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              error: err instanceof Error ? err.message : "Erreur inconnue",
            },
          });
          await prisma.emailCampaign.update({
            where: { id: campaignId },
            data: { failedCount: { increment: 1 } },
          });
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