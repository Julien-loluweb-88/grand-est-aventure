// src/lib/push.ts
import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export async function sendPushNotifications(
  tokens: string[],
  message: PushMessage
): Promise<void> {
  if (tokens.length === 0) return;

  const chunks = chunkArray(tokens, 100);

  for (const chunk of chunks) {
    const messages = chunk.map((token) => ({
      to: token,
      title: message.title,
      body: message.body,
      data: message.data ?? {},
      sound: message.sound ?? "default",
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error("Expo Push API erreur:", response.status, await response.text());
    }
  }
}

export async function getTokensForUser(userId: string): Promise<string[]> {
  const rows = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  });
  return rows.map((r) => r.token);
}

export async function getTokensForUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const rows = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });
  return rows.map((r) => r.token);
}