"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "../utilisateurs/[id]/_lib/user-admin-guard";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { runEmailCampaign } from "@/lib/emailing";

export async function sendEmailCampaign(data: {
  subject: string;
  text: string;
  html: string;
  recipientEmails: string[];
}) {
  try {
    await requireSuperadmin();
  } catch {
    return { success: false as const, message: "Non autorisé." };
  }

  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { success: false as const, message: "Non autorisé." };
  }

  const uniqueEmails = [...new Set(data.recipientEmails)];
  if (uniqueEmails.length === 0) {
    return { success: false as const, message: "Aucun destinataire sélectionné." };
  }
  if (!data.subject.trim() || !data.text.trim()) {
    return { success: false as const, message: "Objet et message requis." };
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      subject: data.subject,
      text: data.text,
      html: data.html,
      createdById: actor.id,
      totalCount: uniqueEmails.length,
      recipients: {
        create: uniqueEmails.map((email) => ({ email })),
      },
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      action: "emailing.campaign.sent",
      actorUserId: actor.id,
      payload: {
        campaignId: campaign.id,
        subject: campaign.subject,
        recipientCount: uniqueEmails.length,
      },
    },
  });

  after(runEmailCampaign(campaign.id));

  revalidatePath("/admin-game/dashboard/emailing");
  revalidatePath("/admin-game/dashboard/journal-admin");

  return {
    success: true as const,
    message: `Envoi lancé pour ${uniqueEmails.length} destinataire(s).`,
    campaignId: campaign.id,
  };
}