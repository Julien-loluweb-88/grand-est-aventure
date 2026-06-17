"use server";

import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { sendPushNotifications } from "@/lib/push";

export async function sendPushCampaign(input: {
  title: string;
  body: string;
}): Promise<{ ok: true; sent: number } | { ok: false; error: string }> {
  const actor = await getAdminActorForAuthorization();
  console.log("[sendPushCampaign] actor:", actor);
  
  if (!actor) {
    return { ok: false, error: "Non autorisé." };
  }

  const title = input.title.trim();
  const body = input.body.trim();

  if (!title || !body) {
    return { ok: false, error: "Titre et message requis." };
  }

  const rows = await prisma.pushToken.findMany({
    select: { token: true },
  });
  const tokens = rows.map((r) => r.token);

  await sendPushNotifications(tokens, {
    title,
    body,
    data: { type: "event" },
  });

  return { ok: true, sent: tokens.length };
}