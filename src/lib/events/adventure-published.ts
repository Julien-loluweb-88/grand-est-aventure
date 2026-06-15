import { prisma } from "@/lib/prisma";
import { sendPushNotifications, getTokensForUsers } from "@/lib/push";

export async function onAdventurePublished(adventure: {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}): Promise<void> {
  // Récupère les users ayant une position connue dans un rayon de 30km
  const nearbyUsers = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "user"
    WHERE "lastLatitude" IS NOT NULL
    AND "lastLongitude" IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(${adventure.latitude})) * cos(radians("lastLatitude")) *
        cos(radians("lastLongitude") - radians(${adventure.longitude})) +
        sin(radians(${adventure.latitude})) * sin(radians("lastLatitude"))
      )
    ) < 30
  `;

  if (nearbyUsers.length === 0) return;

  const tokens = await getTokensForUsers(nearbyUsers.map((u) => u.id));

  await sendPushNotifications(tokens, {
    title: "Nouvelle aventure près de toi !",
    body: `"${adventure.name}" vient d'être publiée à proximité.`,
    data: {
      type: "adventure",
      adventureId: adventure.id,
    },
  });
}