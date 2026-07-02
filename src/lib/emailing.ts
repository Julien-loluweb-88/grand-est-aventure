import "server-only";

import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/send-transactional-email";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 1000;

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
    include: { recipients: { where: { status: "PENDING" } } },
  });
  if (!campaign) return;

  for (let i = 0; i < campaign.recipients.length; i += BATCH_SIZE) {
    const batch = campaign.recipients.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (recipient) => {
        try {
          await sendTransactionalEmail({
            to: recipient.email,
            subject: campaign.subject,
            text: campaign.text,
            html: campaign.html,
          });
          await prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "SENT", sentAt: new Date() },
          });
          await prisma.emailCampaign.update({
            where: { id: campaignId },
            data: { sentCount: { increment: 1 } },
          });
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