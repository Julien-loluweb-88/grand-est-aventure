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

  const uniqueEmails = [...new Set(data.recipientEmails.map((email) => email.trim().toLowerCase()))]
    .filter(Boolean);
  if (uniqueEmails.length === 0) {
    return { success: false as const, message: "Aucun destinataire sélectionné." };
  }
  if (!data.subject.trim() || !data.text.trim()) {
    return { success: false as const, message: "Objet et message requis." };
  }

  const existingProspects = await prisma.prospect.findMany({
    where: { email: { in: uniqueEmails } },
    select: { id: true, email: true, status: true },
  });
  const existingByEmail = new Map(existingProspects.map((prospect) => [prospect.email, prospect]));
  const unsubscribedEmails = uniqueEmails.filter(
    (email) => existingByEmail.get(email)?.status === "UNSUBSCRIBED"
  );
  const targetEmails = uniqueEmails.filter((email) => !unsubscribedEmails.includes(email));
  if (targetEmails.length === 0) {
    return {
      success: false as const,
      message: "Tous les destinataires sont désinscrits.",
    };
  }

  const missingEmails = targetEmails.filter((email) => !existingByEmail.has(email));
  if (missingEmails.length > 0) {
    await prisma.prospect.createMany({
      data: missingEmails.map((email) => ({
        email,
        source: "manual_campaign",
        ownerUserId: actor.id,
        nextFollowUpAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      })),
      skipDuplicates: true,
    });
  }
  const prospects = await prisma.prospect.findMany({
    where: { email: { in: targetEmails } },
    select: { id: true, email: true },
  });
  const prospectByEmail = new Map(prospects.map((prospect) => [prospect.email, prospect]));

  const campaign = await prisma.emailCampaign.create({
    data: {
      subject: data.subject,
      text: data.text,
      html: data.html,
      createdById: actor.id,
      totalCount: targetEmails.length,
      recipients: {
        create: targetEmails.map((email) => ({
          email,
          prospectId: prospectByEmail.get(email)?.id,
        })),
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
        recipientCount: targetEmails.length,
        unsubscribedSkippedCount: unsubscribedEmails.length,
      },
    },
  });

  after(runEmailCampaign(campaign.id));

  revalidatePath("/admin-game/dashboard/emailing");
  revalidatePath("/admin-game/dashboard/journal-admin");

  return {
    success: true as const,
    message:
      unsubscribedEmails.length > 0
        ? `Envoi lancé pour ${targetEmails.length} destinataire(s) (${unsubscribedEmails.length} désinscrit(s) ignoré(s)).`
        : `Envoi lancé pour ${targetEmails.length} destinataire(s).`,
    campaignId: campaign.id,
  };
}

export async function seedProspectsFromText(data: {
  raw: string;
  intercommunalite?: string;
  nextFollowUpDays?: number;
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

  const candidates = data.raw
    .split(/[,\n;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const emails = [...new Set(candidates)].filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
  if (emails.length === 0) {
    return { success: false as const, message: "Aucune adresse e-mail valide trouvée." };
  }

  const requestedFollowUp = Number.isFinite(data.nextFollowUpDays)
    ? Number(data.nextFollowUpDays)
    : 7;
  const followUpDays = Math.max(1, Math.min(60, requestedFollowUp));
  const nextFollowUpAt = new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000);

  let created = 0;
  let updated = 0;
  for (const email of emails) {
    const existing = await prisma.prospect.findUnique({
      where: { email },
      select: { id: true, ownerUserId: true },
    });
    await prisma.prospect.upsert({
      where: { email },
      create: {
        email,
        source: "admin_form_seed",
        ownerUserId: actor.id,
        intercommunalite: data.intercommunalite?.trim() || null,
        nextFollowUpAt,
      },
      update: {
        source: "admin_form_seed",
        intercommunalite: data.intercommunalite?.trim() || undefined,
        lastImportedAt: new Date(),
        nextFollowUpAt,
        ...(existing?.ownerUserId ? {} : { ownerUserId: actor.id }),
      },
    });
    if (existing) updated += 1;
    else created += 1;
  }

  await prisma.adminAuditLog.create({
    data: {
      action: "emailing.prospect.seeded",
      actorUserId: actor.id,
      payload: {
        created,
        updated,
        total: emails.length,
      },
    },
  });

  revalidatePath("/admin-game/dashboard/emailing");

  return {
    success: true as const,
    message: `Prospects enregistrés : ${created} créé(s), ${updated} mis à jour.`,
    created,
    updated,
  };
}